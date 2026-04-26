"""
RAG Pipeline — Context oluşturma ve orchestration
"""
from typing import List, Dict, Any


def build_context(hits: List[Dict[str, Any]], max_tokens: int = 3000) -> str:
    """
    Retrieval sonuçlarından LLM için context metni oluşturur.
    Toplam token sayısını max_tokens ile sınırlar.
    """
    parts = []
    total_words = 0

    for i, hit in enumerate(hits, start=1):
        text = hit.get("text", "").strip()
        doc = hit.get("document_name", "Bilinmiyor")
        page = hit.get("page")
        score = hit.get("score", 0)

        words = text.split()
        if total_words + len(words) > max_tokens:
            # Sadece sığan kısmını al
            words = words[: max_tokens - total_words]
            text = " ".join(words)

        if not text:
            break

        page_info = f" · Sayfa {page}" if page else ""
        header = f"[{i}] {doc}{page_info} (skor: {score:.2f})"
        parts.append(f"{header}\n{text}")
        total_words += len(words)

        if total_words >= max_tokens:
            break

    return "\n\n---\n\n".join(parts)


def rerank_hits(
    hits: List[Dict[str, Any]],
    query: str,
) -> List[Dict[str, Any]]:
    """
    Basit keyword-based re-ranking. Üretimde CrossEncoder kullanın.
    Sorgu kelimelerinin chunk'ta geçme sıklığına göre bonus puan ekler.
    """
    query_words = set(query.lower().split())

    for hit in hits:
        text_words = hit.get("text", "").lower().split()
        keyword_hits = sum(1 for w in text_words if w in query_words)
        hit["score"] = float(hit.get("score", 0)) + 0.01 * keyword_hits

    return sorted(hits, key=lambda h: h["score"], reverse=True)
