"""
Embedding Service — Text → Vector dönüşümü

sentence-transformers kullanır (varsayılan: çok dilli MiniLM).
Üretimde OpenAI text-embedding-3-small ile değiştirilebilir.
"""
import asyncio
from functools import lru_cache
from typing import List
import numpy as np
from app.core.config import settings
from app.core.logger import get_logger

logger = get_logger(__name__)


class EmbeddingService:
    def __init__(self):
        self._model = None

    def _load_model(self):
        if self._model is None:
            try:
                from sentence_transformers import SentenceTransformer
                self._model = SentenceTransformer(settings.EMBEDDING_MODEL)
                logger.info(f"[Embedding] Model yüklendi: {settings.EMBEDDING_MODEL}")
            except ImportError:
                logger.warning(
                    "[Embedding] sentence-transformers yüklü değil. "
                    "Dummy embedding kullanılıyor."
                )
                self._model = None
        return self._model

    async def embed_text(self, text: str, is_query: bool = True) -> List[float]:
        return await asyncio.to_thread(self._embed_sync, text, is_query)

    async def embed_batch(self, texts: List[str], is_query: bool = False) -> List[List[float]]:
        return await asyncio.to_thread(self._embed_batch_sync, texts, is_query)

    def _embed_sync(self, text: str, is_query: bool = True) -> List[float]:
        model = self._load_model()
        prefix = "query: " if is_query else "passage: "
        processed_text = f"{prefix}{text.strip()}"
        if model:
            vec = model.encode(processed_text, normalize_embeddings=True)
            return vec.tolist()
        # Fallback: random unit vector for dev/test
        rng = np.random.default_rng(abs(hash(text)) % 2**32)
        vec = rng.random(settings.EMBEDDING_DIM).astype(np.float32)
        vec /= np.linalg.norm(vec)
        return vec.tolist()

    def _embed_batch_sync(self, texts: List[str], is_query: bool = False) -> List[List[float]]:
        model = self._load_model()
        prefix = "query: " if is_query else "passage: "
        processed_texts = [f"{prefix}{t.strip()}" for t in texts]
        if model:
            vecs = model.encode(
                processed_texts,
                normalize_embeddings=True,
                batch_size=settings.EMBEDDING_BATCH_SIZE,
            )
            return vecs.tolist()
        return [self._embed_sync(t, is_query) for t in texts]


embedding_service = EmbeddingService()
