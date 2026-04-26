"""
Retrieval Service — OpenSearch / FAISS vektör arama
"""
from typing import List, Dict, Any, Optional
from app.core.config import settings
from app.services.embedding_service import embedding_service
from app.core.logger import get_logger

logger = get_logger(__name__)


class RetrievalService:
    async def search(
        self,
        query: str,
        top_k: int = 5,
        filter_doc_ids: Optional[List[str]] = None,
    ) -> List[Dict[str, Any]]:
        """Metni embed ederek vektör arama yapar."""
        vector = await embedding_service.embed_text(query, is_query=True)
        return await self.search_by_vector(
            vector=vector, top_k=top_k, filter_doc_ids=filter_doc_ids
        )

    async def search_by_vector(
        self,
        vector: List[float],
        top_k: int = 5,
        filter_doc_ids: Optional[List[str]] = None,
    ) -> List[Dict[str, Any]]:
        """Vektör ile OpenSearch kNN araması yapar. FAISS fallback."""
        try:
            from app.vectorstore.opensearch_client import opensearch_client
            return await opensearch_client.knn_search(
                vector=vector, top_k=top_k, filter_doc_ids=filter_doc_ids
            )
        except Exception as e:
            logger.warning(f"[Retrieval] OpenSearch bağlanamadı: {e}. FAISS fallback")
            try:
                from app.vectorstore.faiss_index import faiss_index
                return faiss_index.search(vector=vector, top_k=top_k)
            except Exception as e2:
                logger.error(f"[Retrieval] FAISS de çalışmıyor: {e2}")
                return []

    async def index_chunks(self, chunks: List[Dict[str, Any]]) -> int:
        """Chunk listesini embed edip indeksler. İndekslenen chunk sayısını döner."""
        texts = [c["text"] for c in chunks]
        vectors = await embedding_service.embed_batch(texts, is_query=False)

        docs = []
        for chunk, vec in zip(chunks, vectors):
            docs.append({**chunk, "embedding": vec})

        try:
            from app.vectorstore.opensearch_client import opensearch_client
            await opensearch_client.bulk_index(docs)
        except Exception as e:
            logger.warning(f"[Retrieval] OpenSearch index hatası: {e}")

        return len(docs)


retrieval_service = RetrievalService()
