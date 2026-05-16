"""
Reranker — CrossEncoder ile top-k sonuçları yeniden sırala
Üretim için: sentence-transformers CrossEncoder kullanılır.
Geliştirme için: keyword overlap fallback.
"""
from typing import List, Dict, Any
from app.core.logger import get_logger

logger = get_logger(__name__)


class Reranker:
    def __init__(self):
        self._model = None

    def _load(self):
        if self._model is None:
            try:
                from sentence_transformers import CrossEncoder
                # Çok dilli model — Türkçe hukuki metinler için ms-marco'nun İngilizce
                # modeli yerine mMiniLM kullanıyoruz
                self._model = CrossEncoder("cross-encoder/mmarco-mMiniLMv2-L12-H384-v1")
                logger.info("[Reranker] Çok dilli CrossEncoder yüklendi (mmarco-mMiniLMv2)")
            except Exception as e:
                logger.warning(f"[Reranker] CrossEncoder yüklenemedi ({e}), keyword fallback")
        return self._model

    def rerank(
        self,
        query: str,
        hits: List[Dict[str, Any]],
    ) -> List[Dict[str, Any]]:
        model = self._load()
        if model:
            pairs = [[query, h["text"]] for h in hits]
            scores = model.predict(pairs)
            for hit, score in zip(hits, scores):
                hit["rerank_score"] = float(score)
            return sorted(hits, key=lambda h: h["rerank_score"], reverse=True)

        # Keyword fallback
        q_words = set(query.lower().split())
        for hit in hits:
            words = hit.get("text", "").lower().split()
            hit["rerank_score"] = sum(1 for w in words if w in q_words) / max(len(words), 1)
        return sorted(hits, key=lambda h: h["rerank_score"], reverse=True)


reranker = Reranker()
