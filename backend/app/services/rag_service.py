"""
RAG Service — ANA BEYİN

Sorgu → Embedding → Retrieval → Re-rank → LLM → Yanıt
"""
from typing import Dict, List, Any
from app.services.embedding_service import embedding_service
from app.services.retrieval_service import retrieval_service
from app.services.llm_service import llm_service
from app.rag.pipeline import build_context
from app.rag.prompt_templates import LEGAL_QA_PROMPT
from app.core.logger import get_logger

logger = get_logger(__name__)


class RAGService:
    async def ask(self, query: str, session_id: str) -> Dict[str, Any]:
        # 1. Embed the query
        query_vector = await embedding_service.embed_text(query)

        # 2. Retrieve top-k chunks
        hits = await retrieval_service.search_by_vector(
            vector=query_vector, top_k=5
        )
        logger.info(f"[RAG] {len(hits)} chunk bulundu")

        if not hits:
            return {
                "answer": "Yüklü dokümanlarınızda bu soruyla ilgili bir bilgi bulunamadı.",
                "sources": [],
            }

        # 3. Build context from hits
        context = build_context(hits)

        # 4. Build prompt and call LLM
        prompt = LEGAL_QA_PROMPT.format(context=context, question=query)
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


rag_service = RAGService()
