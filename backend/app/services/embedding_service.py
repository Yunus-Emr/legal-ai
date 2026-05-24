"""
Embedding Service — Text → Vector dönüşümü

OpenAI text-embedding-3-small kullanır.
Lokal model (sentence-transformers / torch) gerektirmez.
"""
from typing import List
from app.core.config import settings
from app.core.logger import get_logger

logger = get_logger(__name__)

# Lazy-init — ilk kullanımda yaratılır
_client = None


def _get_client():
    global _client
    if _client is None:
        from openai import AsyncOpenAI
        _client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        logger.info(f"[Embedding] OpenAI client hazır — model: {settings.EMBEDDING_MODEL}")
    return _client


class EmbeddingService:
    """OpenAI Embeddings API ile vektör üretimi."""

    async def embed_text(self, text: str, is_query: bool = True) -> List[float]:
        """Tek bir metin için embedding döner."""
        client = _get_client()
        resp = await client.embeddings.create(
            model=settings.EMBEDDING_MODEL,
            input=text.strip(),
            dimensions=settings.EMBEDDING_DIM,
        )
        return resp.data[0].embedding

    async def embed_batch(self, texts: List[str], is_query: bool = False) -> List[List[float]]:
        """Birden fazla metin için toplu embedding döner (tek API çağrısı)."""
        if not texts:
            return []
        client = _get_client()
        cleaned = [t.strip() for t in texts]
        resp = await client.embeddings.create(
            model=settings.EMBEDDING_MODEL,
            input=cleaned,
            dimensions=settings.EMBEDDING_DIM,
        )
        # API sıralama garanti eder (index sırası)
        return [d.embedding for d in resp.data]


embedding_service = EmbeddingService()
