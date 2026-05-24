"""
RAG Service — ANA BEYİN (Gelişmiş)

Sorgu → Embedding → Retrieval → Re-rank → Conversational Memory → LLM → Yanıt
"""
from typing import AsyncIterator, Dict, List, Any, Optional
from app.services.embedding_service import embedding_service
from app.services.retrieval_service import retrieval_service
from app.services.llm_service import llm_service
from app.rag.pipeline import build_context
from app.core.config import settings
from app.core.logger import get_logger

logger = get_logger(__name__)

LEGAL_COT_PROMPT = """Sen uzman bir Türk hukuk asistanısın. Adım adım analiz yaparak soruya yanıt ver.

## Kaynak Doküman Bölümleri
{context}

## Sohbet Geçmişi
{history}

## Kullanıcı Sorusu
{question}

## Yanıt Kuralları
- Yalnızca verilen kaynaklara dayan; varsayımda bulunma
- Madde/fıkra numaralarını açıkça belirt (ör: "4721 sayılı TMK Madde 174")
- Hukuki terimler kullanırken parantez içinde açıklama yap
- Eğer kaynaklarda yanıt yoksa açıkça belirt
- Gerekirse "Bir avukata danışmanızı öneririz" ekle
- Yanıtı markdown formatında yaz (başlıklar, listeler kullan)
- Sohbet geçmişini dikkate al — önceki soruların bağlamını koru

## Hukuki Analiz:"""

NO_DOCS_PROMPT = """Sen uzman bir Türk hukuk asistanısın.

## Sohbet Geçmişi
{history}

## Kullanıcı Sorusu
{question}

Sisteme henüz doküman yüklenmemiş. Genel hukuki bilginle kısa bir yanıt ver ve doküman yüklenmesini öner.
Genel hukuki konularda bilgi verebilirsin ama "yüklü kaynaklara" dayanmak zorunda değilsin.

## Yanıt:"""


async def _build_rag_context(
    query: str,
    db=None,
    cfg: Optional[Dict] = None,
) -> tuple[list, dict]:
    """
    Ortak RAG adımları: retrieval → context + prompt oluşturma.
    Hem ask() hem ask_stream() tarafından kullanılır (DRY).
    Döner: (hits, llm_kwargs)
    """
    llm_model = None
    llm_temp = None
    llm_max_tokens = None
    top_k = settings.RAG_TOP_K

    if cfg is not None:
        llm_model = cfg.get("llm_model")
        llm_temp = cfg.get("temperature")
        llm_max_tokens = cfg.get("max_tokens")
        top_k = cfg.get("top_k", settings.RAG_TOP_K)

    hits = await retrieval_service.search(query=query, top_k=top_k, db=db)
    logger.info(f"[RAG] {len(hits)} chunk bulundu.")

    llm_kwargs = {
        "model": llm_model,
        "temperature": llm_temp,
        "max_tokens": llm_max_tokens,
    }

    return hits, llm_kwargs


class RAGService:
    async def ask(
        self,
        query: str,
        session_id: str,
        history: Optional[List[Dict[str, str]]] = None,
        db=None,
    ) -> Dict[str, Any]:
        cfg = None
        if db is not None:
            from app.services.config_service import config_service
            cfg = await config_service.get_all(db)

        hits, llm_kwargs = await _build_rag_context(query, db=db, cfg=cfg)
        history_text = _format_history(history or [])

        if not hits:
            prompt = NO_DOCS_PROMPT.format(question=query, history=history_text)
            answer = await llm_service.complete(prompt, **llm_kwargs)
            return {"answer": answer, "sources": []}

        context = build_context(hits, max_tokens=2500)
        prompt = LEGAL_COT_PROMPT.format(context=context, question=query, history=history_text)
        answer = await llm_service.complete(prompt, **llm_kwargs)

        sources = [
            {
                "document_name": h.get("document_name", "Bilinmiyor"),
                "chunk_id": h.get("chunk_id"),
                "page": h.get("page"),
                "score": round(h.get("score", 0), 4),
            }
            for h in hits
        ]
        return {"answer": answer, "sources": sources}

    async def ask_stream(
        self,
        query: str,
        session_id: str,
        history: Optional[List[Dict[str, str]]] = None,
        db=None,
    ) -> AsyncIterator[Dict[str, Any]]:
        """
        Streaming RAG — token by token yanıt üretir.
        Önce hits/sources event'i, sonra token stream, sonra done event'i yield eder.
        """
        cfg = None
        if db is not None:
            from app.services.config_service import config_service
            cfg = await config_service.get_all(db)

        hits, llm_kwargs = await _build_rag_context(query, db=db, cfg=cfg)
        history_text = _format_history(history or [])

        sources = [
            {
                "document_name": h.get("document_name", "Bilinmiyor"),
                "chunk_id": h.get("chunk_id"),
                "page": h.get("page"),
                "score": round(h.get("score", 0), 4),
            }
            for h in hits
        ]
        yield {"type": "sources", "sources": sources}

        if not hits:
            prompt = NO_DOCS_PROMPT.format(question=query, history=history_text)
        else:
            context = build_context(hits, max_tokens=2500)
            prompt = LEGAL_COT_PROMPT.format(context=context, question=query, history=history_text)

        if llm_service._get_openai_client():
            async for token in llm_service.stream_openai(prompt, **llm_kwargs):
                yield {"type": "token", "token": token}
        else:
            # Fallback: dummy yanıt simüle et
            import asyncio
            dummy = llm_service._dummy_response(prompt)
            words = dummy.split(" ")
            for i, word in enumerate(words):
                token = word + (" " if i < len(words) - 1 else "")
                yield {"type": "token", "token": token}
                if i % 5 == 0:
                    await asyncio.sleep(0.01)

        yield {"type": "done"}





def _format_history(history: List[Dict[str, str]], window: Optional[int] = None) -> str:
    """
    Son `window` mesajı kullanarak sohbet geçmişini formatlar.
    window parametresi verilmezse settings.RAG_HISTORY_WINDOW kullanılır.
    İçerik artık kesilmiyor — tam metin gönderilir.
    """
    if not history:
        return "Henüz sohbet geçmişi yok."
    w = window or settings.RAG_HISTORY_WINDOW
    lines = []
    for msg in history[-w:]:
        role = "Kullanıcı" if msg["role"] == "user" else "Asistan"
        lines.append(f"{role}: {msg['content']}")  # [:300] kaldırıldı
    return "\n".join(lines)


rag_service = RAGService()
