"""
RAG Service — ANA BEYİN (Gelişmiş)

Sorgu → Embedding → Retrieval → Re-rank → Conversational Memory → LLM → Yanıt
"""
from typing import Dict, List, Any, Optional
from app.services.embedding_service import embedding_service
from app.services.retrieval_service import retrieval_service
from app.services.llm_service import llm_service
from app.rag.pipeline import build_context
from app.rag.reranker import reranker
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


class RAGService:
    async def ask(
        self,
        query: str,
        session_id: str,
        history: Optional[List[Dict[str, str]]] = None,
    ) -> Dict[str, Any]:
        # 1. Embed the query
        query_vector = await embedding_service.embed_text(query)

        # 2. Retrieve top-k chunks
        hits = await retrieval_service.search_by_vector(vector=query_vector, top_k=8)
        logger.info(f"[RAG] {len(hits)} chunk bulundu, re-ranking...")

        # 3. Re-rank (CrossEncoder if available, keyword fallback otherwise)
        if hits:
            hits = await _async_rerank(query, hits)
            hits = hits[:5]  # Top-5 after reranking

        # 4. Build history string
        history_text = _format_history(history or [])

        if not hits:
            # No documents — use general legal knowledge
            prompt = NO_DOCS_PROMPT.format(question=query, history=history_text)
            answer = await llm_service.complete(prompt)
            return {"answer": answer, "sources": []}

        # 5. Build context from hits
        context = build_context(hits)

        # 6. Build CoT prompt and call LLM
        prompt = LEGAL_COT_PROMPT.format(
            context=context,
            question=query,
            history=history_text,
        )
        answer = await llm_service.complete(prompt)

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


async def _async_rerank(query: str, hits: List[Dict]) -> List[Dict]:
    """Run reranker in thread pool to avoid blocking."""
    import asyncio
    return await asyncio.to_thread(reranker.rerank, query, hits)


def _format_history(history: List[Dict[str, str]]) -> str:
    if not history:
        return "Henüz sohbet geçmişi yok."
    lines = []
    for msg in history[-6:]:  # Last 6 messages (3 turns)
        role = "Kullanıcı" if msg["role"] == "user" else "Asistan"
        lines.append(f"{role}: {msg['content'][:300]}")
    return "\n".join(lines)


rag_service = RAGService()

