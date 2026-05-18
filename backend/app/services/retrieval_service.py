"""
Retrieval Service — OpenSearch / FAISS vektör arama
"""
from typing import List, Dict, Any, Optional
from sqlalchemy import select
from app.core.config import settings
from app.db.models import RecordMetadata
from app.db.postgres import SessionLocal
from app.services.embedding_service import embedding_service
from app.core.logger import get_logger

logger = get_logger(__name__)


class RetrievalService:
    async def ensure_index(self) -> None:
        from app.vectorstore.opensearch_client import opensearch_client
        await opensearch_client.ensure_index()

    async def search(
        self,
        query: str,
        top_k: int = 5,
        filter_doc_ids: Optional[List[str]] = None,
    ) -> List[Dict[str, Any]]:
        """Varsayılan arama: Hybrid Search kullanır."""
        return await self.search_hybrid(
            query=query, top_k=top_k, filter_doc_ids=filter_doc_ids
        )

    async def search_hybrid(
        self,
        query: str,
        top_k: int = 5,
        filter_doc_ids: Optional[List[str]] = None,
        alpha: float = 0.7,
    ) -> List[Dict[str, Any]]:
        """Hem vektörel hem de metin bazlı arama (Hybrid) yapar."""
        vector = await embedding_service.embed_text(query, is_query=True)
        try:
            from app.vectorstore.opensearch_client import opensearch_client
            # opensearch_client'taki yeni hybrid_search metodunu çağırıyoruz
            hits = await opensearch_client.hybrid_search(
                vector=vector, 
                query_text=query, 
                top_k=top_k, 
                alpha=alpha,
                filter_doc_ids=filter_doc_ids
            )
            return await self._enrich_hits_with_metadata(hits)
        except Exception as e:
            logger.warning(f"[Retrieval] OpenSearch Hybrid bağlanamadı: {e}. FAISS kNN fallback")
            return await self.search_by_vector(vector=vector, top_k=top_k, filter_doc_ids=filter_doc_ids)

    async def search_by_vector(
        self,
        vector: List[float],
        top_k: int = 5,
        filter_doc_ids: Optional[List[str]] = None,
    ) -> List[Dict[str, Any]]:
        """Vektör ile OpenSearch kNN araması yapar. FAISS fallback."""
        try:
            from app.vectorstore.opensearch_client import opensearch_client
            hits = await opensearch_client.knn_search(
                vector=vector, top_k=top_k, filter_doc_ids=filter_doc_ids
            )
            return await self._enrich_hits_with_metadata(hits)
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
        if not chunks:
            return 0

        await self.ensure_index()
        texts = [c["text"] for c in chunks]
        vectors = await embedding_service.embed_batch(texts, is_query=False)

        docs = []
        for chunk, vec in zip(chunks, vectors):
            docs.append({**chunk, "embedding": vec})

        try:
            from app.vectorstore.opensearch_client import opensearch_client
            await opensearch_client.bulk_index(docs)
            logger.info(f"[Retrieval] {len(docs)} chunk OpenSearch'e yazıldı")
        except Exception as e:
            logger.warning(f"[Retrieval] OpenSearch index hatası: {e} — FAISS fallback'e yazılıyor")
            try:
                from app.vectorstore.faiss_index import faiss_index
                faiss_index.add(docs)
                logger.info(f"[Retrieval] {len(docs)} chunk FAISS'e yazıldı (fallback)")
            except Exception as e2:
                logger.error(f"[Retrieval] FAISS de yazılamadı: {e2}")

        return len(docs)


    async def _enrich_hits_with_metadata(self, hits: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        chunk_ids = [h.get("chunk_id") for h in hits if h.get("chunk_id")]
        if not chunk_ids:
            return hits

        async with SessionLocal() as db:
            result = await db.execute(
                select(RecordMetadata).where(RecordMetadata.id.in_(chunk_ids))
            )
            rows = result.scalars().all()

        metadata_by_id = {
            row.id: {
                "article": row.article,
                "section": row.section,
                "law_name": row.law_name,
                "kanun_no": row.kanun_no,
                "source_file": row.source_file,
            }
            for row in rows
        }

        enriched: List[Dict[str, Any]] = []
        for hit in hits:
            meta = metadata_by_id.get(hit.get("chunk_id"), {})
            if meta:
                existing = hit.get("metadata") or {}
                hit["metadata"] = {**existing, **meta}
                if not hit.get("document_name"):
                    hit["document_name"] = meta.get("source_file")
            enriched.append(hit)
        return enriched


retrieval_service = RetrievalService()
