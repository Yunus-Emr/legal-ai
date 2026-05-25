"""
OpenSearch Client — kNN vektör arama + bulk indexing
"""
import asyncio
from typing import List, Dict, Any, Optional
from app.core.config import settings
from app.core.logger import get_logger
from app.vectorstore.schema import LEGAL_INDEX_MAPPING

logger = get_logger(__name__)


class OpenSearchClient:
    def __init__(self):
        self._client = None

    def _get_client(self):
        if self._client is None:
            try:
                from opensearchpy import AsyncOpenSearch
                auth = None
                if settings.OPENSEARCH_USER:
                    auth = (settings.OPENSEARCH_USER, settings.OPENSEARCH_PASS)
                self._client = AsyncOpenSearch(
                    hosts=[{"host": settings.OPENSEARCH_HOST, "port": settings.OPENSEARCH_PORT}],
                    http_auth=auth,
                    use_ssl=settings.OPENSEARCH_USE_SSL,
                    verify_certs=settings.OPENSEARCH_VERIFY_CERTS,
                )
            except ImportError:
                logger.warning("[OpenSearch] opensearch-py yüklü değil")
        return self._client

    async def knn_search(
        self,
        vector: List[float],
        top_k: int = 5,
        filter_doc_ids: Optional[List[str]] = None,
    ) -> List[Dict[str, Any]]:
        client = self._get_client()
        if client is None:
            raise RuntimeError("OpenSearch client yok")

        query: Dict[str, Any] = {
            "knn": {
                "embedding": {
                    "vector": vector,
                    "k": top_k,
                }
            }
        }

        if filter_doc_ids:
            query = {
                "bool": {
                    "must": [{"knn": query["knn"]}],
                    "filter": [{"terms": {"doc_id": filter_doc_ids}}],
                }
            }

        response = await client.search(
            index=settings.OPENSEARCH_INDEX,
            body={"size": top_k, "query": query},
        )

        hits = []
        for h in response["hits"]["hits"]:
            hits.append(
                {
                    "chunk_id": h["_id"],
                    "score": h["_score"],
                    **h["_source"],
                }
            )
        return hits

    async def bulk_index(self, docs: List[Dict[str, Any]]) -> None:
        client = self._get_client()
        if client is None:
            raise RuntimeError("OpenSearch client yok")

        actions = []
        for doc in docs:
            actions.append({"index": {"_index": settings.OPENSEARCH_INDEX, "_id": doc["chunk_id"]}})
            actions.append(doc)

        await client.bulk(body=actions)
        logger.info(f"[OpenSearch] {len(docs)} doküman indekslendi")

    async def ensure_index(self) -> None:
        client = self._get_client()
        if client is None:
            raise RuntimeError("OpenSearch client yok")
        exists = await client.indices.exists(index=settings.OPENSEARCH_INDEX)
        if not exists:
            await client.indices.create(index=settings.OPENSEARCH_INDEX, body=LEGAL_INDEX_MAPPING)
            logger.info(f"[OpenSearch] Index oluşturuldu: {settings.OPENSEARCH_INDEX}")

    async def delete_by_doc_id(self, doc_id: str) -> None:
        client = self._get_client()
        if client is None:
            return
        await client.delete_by_query(
            index=settings.OPENSEARCH_INDEX,
            body={"query": {"term": {"doc_id": doc_id}}},
        )

    async def get_chunks_by_doc_id(self, doc_id: str) -> List[Dict[str, Any]]:
        client = self._get_client()
        if client is None:
            raise RuntimeError("OpenSearch client yok")
        
        response = await client.search(
            index=settings.OPENSEARCH_INDEX,
            body={
                "size": 500,
                "query": {
                    "term": {"doc_id": doc_id}
                },
                "sort": [
                    {"page": {"order": "asc"}},
                    {"chunk_id": {"order": "asc"}}
                ]
            }
        )
        
        hits = []
        for h in response["hits"]["hits"]:
            source = h["_source"]
            if "embedding" in source:
                del source["embedding"]
            hits.append({
                "chunk_id": h["_id"],
                **source
            })
        return hits


    async def hybrid_search(
        self,
        vector: List[float],
        query_text: str,
        top_k: int = 5,
        alpha: float = 0.7,
        filter_doc_ids: Optional[List[str]] = None,
    ) -> List[Dict[str, Any]]:
        """
        Hybrid Search — Vektör (kNN) + BM25 text aramasını birleştirir.

        alpha=1.0  → tam vektör araması
        alpha=0.0  → tam BM25 araması
        alpha=0.7  → %70 vektör, %30 BM25 (varsayılan)
        """
        client = self._get_client()
        if client is None:
            raise RuntimeError("OpenSearch client yok")

        # 1. kNN Vektör araması
        knn_query: Dict[str, Any] = {
            "knn": {
                "embedding": {
                    "vector": vector,
                    "k": top_k * 2,  # Daha fazla aday alıp birleştirme sonrası filtrele
                }
            }
        }
        if filter_doc_ids:
            knn_query = {
                "bool": {
                    "must": [{"knn": knn_query["knn"]}],
                    "filter": [{"terms": {"doc_id": filter_doc_ids}}],
                }
            }

        # 2. BM25 Text araması
        bm25_query: Dict[str, Any] = {
            "bool": {
                "should": [
                    {"match": {"text": {"query": query_text, "boost": 1.5}}},
                    {"match": {"document_name": {"query": query_text, "boost": 0.5}}},
                ]
            }
        }
        if filter_doc_ids:
            bm25_query["bool"]["filter"] = [{"terms": {"doc_id": filter_doc_ids}}]

        # Paralel çalıştır
        knn_response, bm25_response = await asyncio.gather(
            client.search(
                index=settings.OPENSEARCH_INDEX,
                body={"size": top_k * 2, "query": knn_query},
            ),
            client.search(
                index=settings.OPENSEARCH_INDEX,
                body={"size": top_k * 2, "query": bm25_query},
            ),
        )

        # 3. Skorları normalize edip birleştir
        def normalize(hits: list) -> Dict[str, float]:
            if not hits:
                return {}
            max_score = max(h["_score"] for h in hits) or 1.0
            return {h["_id"]: h["_score"] / max_score for h in hits}

        knn_scores  = normalize(knn_response["hits"]["hits"])
        bm25_scores = normalize(bm25_response["hits"]["hits"])

        # Tüm chunk ID'lerini topla
        all_ids = set(knn_scores) | set(bm25_scores)
        combined: Dict[str, float] = {
            cid: alpha * knn_scores.get(cid, 0.0) + (1 - alpha) * bm25_scores.get(cid, 0.0)
            for cid in all_ids
        }

        # En iyi top_k sonucu seç
        top_ids = sorted(combined, key=lambda x: combined[x], reverse=True)[:top_k]

        # Kaynak veriyi bul (kNN ve BM25 sonuçlarından)
        source_map: Dict[str, Dict] = {}
        for h in knn_response["hits"]["hits"] + bm25_response["hits"]["hits"]:
            if h["_id"] not in source_map:
                source_map[h["_id"]] = h["_source"]

        results = []
        for cid in top_ids:
            src = source_map.get(cid, {})
            results.append({
                "chunk_id": cid,
                "score": round(combined[cid], 4),
                **src,
            })

        return results

    async def ping(self) -> bool:
        client = self._get_client()
        if client is None:
            return False
        try:
            return await client.ping()
        except Exception:
            return False


opensearch_client = OpenSearchClient()
