"""
FAISS Index — Local vektör arama (dev/test)
"""
import os
import pickle
from typing import List, Dict, Any, Optional
from app.core.config import settings
from app.core.logger import get_logger

logger = get_logger(__name__)

INDEX_PATH = "data/embeddings/faiss.index"
META_PATH = "data/embeddings/faiss_meta.pkl"


class FAISSIndex:
    def __init__(self):
        self._index = None
        self._metadata: List[Dict[str, Any]] = []

    def _load_or_create(self, dim: int):
        if self._index is not None:
            return self._index
        try:
            import faiss
            if os.path.exists(INDEX_PATH):
                self._index = faiss.read_index(INDEX_PATH)
                with open(META_PATH, "rb") as f:
                    self._metadata = pickle.load(f)
                logger.info(f"[FAISS] Index yüklendi: {self._index.ntotal} vektör")
            else:
                self._index = faiss.IndexFlatIP(dim)  # Inner product = cosine on unit vecs
                logger.info(f"[FAISS] Yeni index oluşturuldu (dim={dim})")
        except ImportError:
            logger.warning("[FAISS] faiss-cpu yüklü değil")
        return self._index

    def add(self, docs: List[Dict[str, Any]]) -> None:
        import numpy as np
        import faiss
        dim = len(docs[0]["embedding"])
        idx = self._load_or_create(dim)
        if idx is None:
            return

        vectors = np.array([d["embedding"] for d in docs], dtype=np.float32)
        idx.add(vectors)
        for doc in docs:
            self._metadata.append({k: v for k, v in doc.items() if k != "embedding"})

        self._save()
        logger.info(f"[FAISS] {len(docs)} vektör eklendi")

    def search(
        self, vector: List[float], top_k: int = 5
    ) -> List[Dict[str, Any]]:
        import numpy as np
        idx = self._load_or_create(len(vector))
        if idx is None or idx.ntotal == 0:
            return []

        q = np.array([vector], dtype=np.float32)
        scores, indices = idx.search(q, min(top_k, idx.ntotal))

        results = []
        for score, i in zip(scores[0], indices[0]):
            if i < 0:
                continue
            hit = {**self._metadata[i], "score": float(score)}
            results.append(hit)
        return results

    def _save(self) -> None:
        import faiss
        os.makedirs(os.path.dirname(INDEX_PATH), exist_ok=True)
        faiss.write_index(self._index, INDEX_PATH)
        with open(META_PATH, "wb") as f:
            pickle.dump(self._metadata, f)


faiss_index = FAISSIndex()
