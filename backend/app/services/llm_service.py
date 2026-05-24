"""
LLM Service — OpenAI API entegrasyonu
"""
import asyncio
from typing import Optional, AsyncIterator
from app.core.config import settings
from app.core.logger import get_logger

logger = get_logger(__name__)

class LLMService:
    def __init__(self):
        self._openai_client = None

    def _get_openai_client(self):
        if self._openai_client is None and settings.OPENAI_API_KEY:
            from openai import AsyncOpenAI
            self._openai_client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        return self._openai_client

    async def complete(
        self,
        prompt: str,
        system: Optional[str] = None,
        model: Optional[str] = None,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
        provider: Optional[str] = None,
    ) -> str:
        prov = provider or settings.LLM_PROVIDER
        if prov == "openai":
            return await self._complete_openai(
                prompt,
                system,
                model=model,
                temperature=temperature,
                max_tokens=max_tokens
            )
        else:
            logger.warning(f"[LLM] Bilinmeyen provider veya konfigüre edilmemiş: {prov}, dummy dönülüyor")
            return self._dummy_response(prompt)

    async def _complete_openai(
        self,
        prompt: str,
        system: Optional[str] = None,
        model: Optional[str] = None,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
    ) -> str:
        client = self._get_openai_client()
        if client is None:
            logger.warning("[LLM] OpenAI client yok (OPENAI_API_KEY eksik olabilir), dummy yanıt dönülüyor")
            return self._dummy_response(prompt)

        messages = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})

        # Dynamic fallback to settings
        selected_model = model or settings.LLM_MODEL
        selected_temp = temperature if temperature is not None else settings.LLM_TEMPERATURE
        selected_tokens = max_tokens or settings.LLM_MAX_TOKENS

        try:
            response = await client.chat.completions.create(
                model=selected_model,
                messages=messages,
                temperature=selected_temp,
                max_tokens=selected_tokens,
            )
            return response.choices[0].message.content or ""
        except Exception as e:
            logger.error(f"[LLM] OpenAI hatası: {e}")
            return f"OpenAI çağrısı sırasında hata oluştu: {str(e)}"

    async def stream_openai(
        self,
        prompt: str,
        system: Optional[str] = None,
        model: Optional[str] = None,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
    ) -> AsyncIterator[str]:
        """OpenAI üzerinden gerçek token-by-token streaming generator."""
        client = self._get_openai_client()
        if client is None:
            yield self._dummy_response(prompt)
            return

        messages = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})

        # Dynamic fallback to settings
        selected_model = model or settings.LLM_MODEL
        selected_temp = temperature if temperature is not None else settings.LLM_TEMPERATURE
        selected_tokens = max_tokens or settings.LLM_MAX_TOKENS

        try:
            stream = await client.chat.completions.create(
                model=selected_model,
                messages=messages,
                temperature=selected_temp,
                max_tokens=selected_tokens,
                stream=True,
            )
            async for chunk in stream:
                delta = chunk.choices[0].delta.content
                if delta:
                    yield delta
        except Exception as e:
            logger.error(f"[LLM] OpenAI streaming hatası: {e}")
            yield f"\n[Streaming Hatası: {str(e)}]"

    def _dummy_response(self, prompt: str) -> str:
        return (
            "**[Demo Yanıtı]** OpenAI API anahtarı yapılandırılmamış. "
            "Lütfen `.env` dosyasındaki `OPENAI_API_KEY` değerini girin.\n\n"
            f"Sorunuz **{prompt[:100]}...** için ilgili doküman bölümleri bulundu."
        )

llm_service = LLMService()
