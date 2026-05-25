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

LEGAL_COT_PROMPT = """Sen, kurumsal hukuk büroları ve hukuk departmanları için geliştirilmiş, üst düzey yetkinliğe sahip kıdemli bir Türk Hukuku Yapay Zeka Danışmanısın. Kullanıcıya son derece profesyonel, detaylı, hukuki terimleri yerinde kullanan ve mevzuata tam uyumlu mükemmel yanıtlar vermelisin.

## Kaynak Doküman Bölümleri (RAG Bağlamı)
{context}

## Sohbet Geçmişi
{history}

## Kullanıcı Sorusu
{question}

## Yanıt Standartları ve Kuralları:
1. **Derinlik ve Detay**: Soruyu yüzeysel geçiştirme. Hukuki kavramları, gerekçeleriyle ve mevzuat temelinde ayrıntılı olarak açıkla. Adım adım akıl yürütme (Chain of Thought) metodunu kullan.
2. **Mevzuat Atıfları**: Yanıtında atıfta bulunduğun kanun, madde, fıkra ve bentleri kesin ve net olarak belirt (Ör: "4857 sayılı İş Kanunu Madde 25/II-g bendi", "6098 sayılı Türk Borçlar Kanunu Madde 19").
3. **Türkiye Cumhuriyeti Mevzuatı**: Yanıtların tamamen Türkiye Cumhuriyeti kanunlarına, yönetmeliklerine, Yargıtay/Danıştay içtihat ilkelerine uygun olmalıdır.
4. **Kaynaklara Sadakat**: Öncelikle yukarıda sağlanan "Kaynak Doküman Bölümleri"ni temel al. Kaynaklardaki ifadeleri profesyonelce yorumla ve sorunun cevabını doğrudan bu kaynaklarla ilişkilendir.
5. **Yapısal ve Görsel Düzen (Markdown)**: Yanıtını profesyonel bir hukuki mütalaa (opinion letter) formatında yapılandır. Başlıklar (`###`), kalın harfler (`**`), maddeli listeler ve gerekirse tablolar kullanarak okunabilirliği maksimize et.
6. **Bilinmeyen Durumlar**: Eğer sağlanan kaynaklar soruyu cevaplamak için tamamen yetersizse, bunu açıkça belirt ancak genel Türk hukuku prensiplerine göre yol gösterici, yapıcı ve yüksek kaliteli ek hukuki rehberlik sun.
7. **Öneri**: Görüşünün sonunda, kurumsal bir tonla atılması gereken pratik ve koruyucu hukuki adımları listele.

## Hukuki Analiz ve Mütalaa:"""

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
                "text": h.get("text", ""),
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
                "text": h.get("text", ""),
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
