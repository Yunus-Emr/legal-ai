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
                    use_ssl=False,
                    verify_certs=False,
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

    async def ping(self) -> bool:
        client = self._get_client()
        if client is None:
            return False
        try:
            return await client.ping()
        except Exception:
            return False


opensearch_client = OpenSearchClient()
