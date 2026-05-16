"""
RAG Pipeline — Context oluşturma

NOT: rerank_hits() fonksiyonu kaldırıldı.
     Reranking için app/rag/reranker.py::Reranker sınıfını kullanın.
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
