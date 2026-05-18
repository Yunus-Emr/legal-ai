"""
LLM Service — OpenAI / HuggingFace çağrıları

Provider seçimi:
  - openai      : OpenAI API (GPT-3.5/4/4o vb.)
  - huggingface : Doğrudan PyTorch inference (ağır, sadece GPU yok ise)
"""
import re
import asyncio
from typing import Optional, AsyncIterator
from app.core.config import settings
from app.core.logger import get_logger

logger = get_logger(__name__)

class LLMService:
    def __init__(self):
        self._openai_client = None
        self._local_model = None
        self._local_tokenizer = None

    def _get_openai_client(self):
        if self._openai_client is None and settings.OPENAI_API_KEY:
            from openai import AsyncOpenAI
            self._openai_client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        return self._openai_client

    def _load_local_model(self):
        if self._local_model is None:
            import torch
            from transformers import AutoModelForCausalLM, AutoTokenizer

            # CUDA erişilebilirlik kontrolü — GPU yoksa CPU'ya düş
            device = settings.LLM_DEVICE
            if device == "cuda" and not torch.cuda.is_available():
                logger.warning("[LLM] CUDA isteği yapıldı ama GPU bulunamadı — CPU'ya düşülüyor")
                device = "cpu"
            elif device == "cuda":
                gpu_name = torch.cuda.get_device_name(0)
                logger.info(f"[LLM] GPU bulundu: {gpu_name}")

            logger.info(f"[LLM] Yerel model yükleniyor: {settings.LLM_LOCAL_MODEL_PATH} (device={device})")
            self._local_tokenizer = AutoTokenizer.from_pretrained(settings.LLM_LOCAL_MODEL_PATH)
            self._local_model = AutoModelForCausalLM.from_pretrained(
                settings.LLM_LOCAL_MODEL_PATH,
                torch_dtype=torch.float32 if device == "cpu" else torch.float16,
                device_map=device
            )
            # Gerçek device'ı kaydet (fallback durumunda değişmiş olabilir)
            self._effective_device = device
            logger.info(f"[LLM] Yerel model başarıyla yüklendi ({device})")
        return self._local_model, self._local_tokenizer

    async def complete(self, prompt: str, system: Optional[str] = None) -> str:
        if settings.LLM_PROVIDER == "openai":
            return await self._complete_openai(prompt, system)
        elif settings.LLM_PROVIDER == "huggingface":
            return await self._complete_local(prompt, system)
        else:
            logger.warning(f"[LLM] Bilinmeyen provider: {settings.LLM_PROVIDER}, dummy dönülüyor")
            return self._dummy_response(prompt)

    async def _complete_openai(self, prompt: str, system: Optional[str] = None) -> str:
        client = self._get_openai_client()
        if client is None:
            logger.warning("[LLM] OpenAI client yok, dummy yanıt dönülüyor")
            return self._dummy_response(prompt)

        messages = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})

        try:
            response = await client.chat.completions.create(
                model=settings.LLM_MODEL,
                messages=messages,
                temperature=settings.LLM_TEMPERATURE,
                max_tokens=settings.LLM_MAX_TOKENS,
            )
            return response.choices[0].message.content or ""
        except Exception as e:
            logger.error(f"[LLM] OpenAI hatası: {e}")
            return self._dummy_response(prompt)

    async def stream_openai(self, prompt: str, system: Optional[str] = None) -> AsyncIterator[str]:
        """OpenAI üzerinden gerçek token-by-token streaming generator."""
        client = self._get_openai_client()
        if client is None:
            yield self._dummy_response(prompt)
            return

        messages = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})

        try:
            stream = await client.chat.completions.create(
                model=settings.LLM_MODEL,
                messages=messages,
                temperature=settings.LLM_TEMPERATURE,
                max_tokens=settings.LLM_MAX_TOKENS,
                stream=True,
            )
            async for chunk in stream:
                delta = chunk.choices[0].delta.content
                if delta:
                    yield delta
        except Exception as e:
            logger.error(f"[LLM] OpenAI streaming hatası: {e}")
            yield self._dummy_response(prompt)

    async def _complete_local(self, prompt: str, system: Optional[str] = None) -> str:
        try:
            import torch
            model, tokenizer = await asyncio.to_thread(self._load_local_model)
            # Gerçek cihazı kullan (CUDA fallback sonrası değişmiş olabilir)
            effective_device = getattr(self, "_effective_device", settings.LLM_DEVICE)

            # Basit chat formatı (TinyLlama ve benzerleri için)
            full_prompt = f"<|system|>\n{system or 'Sen yardımcı bir asistanısın.'}</s>\n<|user|>\n{prompt}</s>\n<|assistant|>\n"

            inputs = tokenizer(full_prompt, return_tensors="pt").to(effective_device)
            
            with torch.no_grad():
                outputs = await asyncio.to_thread(
                    model.generate,
                    **inputs,
                    max_new_tokens=settings.LLM_MAX_TOKENS,
                    temperature=settings.LLM_TEMPERATURE,
                    do_sample=True,
                    pad_token_id=tokenizer.eos_token_id
                )
            
            decoded = tokenizer.decode(outputs[0], skip_special_tokens=True)
            # Sadece asistanın yanıtını al
            if "<|assistant|>\n" in decoded:
                answer = decoded.split("<|assistant|>\n")[-1].strip()
            else:
                answer = decoded.replace(full_prompt, "").strip()
                
            return answer
        except Exception as e:
            logger.error(f"[LLM] Yerel model hatası: {e}")
            return f"Yerel model çalışırken hata oluştu: {str(e)}"

    def _dummy_response(self, prompt: str) -> str:
        return (
            "**[Demo Yanıtı]** LLM yapılandırılmamış. "
            "Gerçek yanıtlar için `.env` dosyasını düzenleyin.\n\n"
            f"Sorunuz **{prompt[:100]}...** için ilgili doküman bölümleri bulundu."
        )


llm_service = LLMService()
