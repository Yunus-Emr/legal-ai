"""
Chunking — PDF/text metnini örtüşen parçalara böler
"""
import re
import uuid
from typing import List, Dict, Any, Optional


def chunk_text(
    text: str,
    doc_id: str,
    filename: str,
    chunk_size: int = 512,
    overlap: int = 64,
    page: Optional[int] = None,
) -> List[Dict[str, Any]]:
    """
    Metni chunk_size token'lık (kelime) parçalara böler,
    parçalar arasında overlap kadar örtüşme bırakır.
    """
    words = text.split()
    chunks = []
    i = 0

    while i < len(words):
        end = min(i + chunk_size, len(words))
        chunk_words = words[i:end]
        chunk_text_str = " ".join(chunk_words)

        entry: Dict[str, Any] = {
            "chunk_id": str(uuid.uuid4()),
            "doc_id": doc_id,
            "document_name": filename,
            "text": chunk_text_str,
            "word_count": len(chunk_words),
            "start_word": i,
        }
        if page is not None:
            entry["page"] = page
        chunks.append(entry)

        if end == len(words):
            break
        i += chunk_size - overlap

    return chunks


def chunk_by_paragraph(
    text: str,
    doc_id: str,
    filename: str,
    max_words: int = 400,
    page: Optional[int] = None,
) -> List[Dict[str, Any]]:
    """
    Paragraf bazlı chunking — madde/paragraf sınırlarını korur.
    Hukuki metinler için daha iyi sonuç verebilir.
    """
    if not text or not text.strip():
        return []

    paragraphs = re.split(r"\n{2,}", text.strip())
    chunks = []
    buffer: List[str] = []
    buf_words = 0
    current_start_word = 0

    for para in paragraphs:
        words = para.split()
        if not words:
            continue
        if buf_words + len(words) > max_words and buffer:
            entry: Dict[str, Any] = {
                "chunk_id": str(uuid.uuid4()),
                "doc_id": doc_id,
                "document_name": filename,
                "text": "\n\n".join(buffer),
                "word_count": buf_words,
                "start_word": current_start_word,
            }
            if page is not None:
                entry["page"] = page
            chunks.append(entry)
            current_start_word += buf_words
            buffer = []
            buf_words = 0
        buffer.append(para)
        buf_words += len(words)

    if buffer:
        entry = {
            "chunk_id": str(uuid.uuid4()),
            "doc_id": doc_id,
            "document_name": filename,
            "text": "\n\n".join(buffer),
            "word_count": buf_words,
            "start_word": current_start_word,
        }
        if page is not None:
            entry["page"] = page
        chunks.append(entry)

    return chunks

