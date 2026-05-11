import asyncio
import json
import os
import sys
import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

from sqlalchemy import text
from sqlalchemy.dialects.postgresql import insert

# Allow running as: python3 backend/scripts/ingest_from_jsonl.py
BACKEND_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if BACKEND_ROOT not in sys.path:
    sys.path.insert(0, BACKEND_ROOT)

from app.db.models import Document, RecordMetadata
from app.db.postgres import SessionLocal
from app.services.retrieval_service import retrieval_service

JSONL_DIR = "/home/yunus/TestFolder/legal-ai/data/chunks"
BATCH_SIZE = 100


def _parse_extraction_date(value: Optional[str]) -> Optional[datetime]:
    if not value:
        return None
    try:
        return datetime.fromisoformat(value)
    except ValueError:
        return None


def _derive_doc_id(filename: str) -> str:
    return str(uuid.uuid5(uuid.NAMESPACE_URL, f"doc:{filename}"))


def _derive_chunk_id(data: Dict[str, Any], filename: str) -> str:
    if data.get("chunk_id"):
        return data["chunk_id"]
    window = data.get("window_index", 0)
    text_preview = (data.get("text") or "")[:200]
    return str(uuid.uuid5(uuid.NAMESPACE_URL, f"{filename}:{window}:{text_preview}"))


def _build_record_dict(data: Dict[str, Any], filename: str, chunk_id: str) -> Dict[str, Any]:
    return {
        "id": chunk_id,
        "text": data.get("text", ""),
        "article": data.get("article"),
        "section": data.get("section"),
        "pages": data.get("pages"),
        "window_index": data.get("window_index"),
        "total_windows": data.get("total_windows"),
        "method": data.get("method"),
        "word_count": data.get("word_count"),
        "char_count": data.get("char_count"),
        "law_name": data.get("law_name"),
        "source_file": filename,
        "doc_type": data.get("doc_type"),
        "kanun_no": data.get("kanun_no"),
        "resmi_gazete_tarihi": data.get("resmi_gazete_tarihi"),
        "resmi_gazete_sayisi": data.get("resmi_gazete_sayisi"),
        "kabul_tarihi": data.get("kabul_tarihi"),
        "kurumlar": data.get("kurumlar"),
        "kisiler": data.get("kisiler"),
        "toplam_sayfa": data.get("toplam_sayfa"),
        "extraction_date": _parse_extraction_date(data.get("extraction_date")),
    }


def _build_chunk_payload(data: Dict[str, Any], filename: str, doc_id: str, chunk_id: str) -> Dict[str, Any]:
    pages = data.get("pages") or []
    first_page = pages[0] if isinstance(pages, list) and pages else None
    return {
        "chunk_id": chunk_id,
        "doc_id": doc_id,
        "document_name": filename,
        "text": data.get("text", ""),
        "page": first_page,
        "word_count": data.get("word_count"),
        "metadata": {
            "source": filename,
            "article": data.get("article"),
            "section": data.get("section"),
            "law_name": data.get("law_name"),
            "kanun_no": data.get("kanun_no"),
        },
    }


async def _upsert_documents(rows: List[Dict[str, Any]]) -> None:
    if not rows:
        return
    async with SessionLocal() as db:
        stmt = insert(Document).values(rows)
        stmt = stmt.on_conflict_do_update(
            index_elements=[Document.id],
            set_={
                "filename": stmt.excluded.filename,
                "size_bytes": stmt.excluded.size_bytes,
                "status": stmt.excluded.status,
            },
        )
        await db.execute(stmt)
        await db.commit()


async def _upsert_metadata(rows: List[Dict[str, Any]]) -> None:
    if not rows:
        return
    async with SessionLocal() as db:
        stmt = insert(RecordMetadata).values(rows)
        stmt = stmt.on_conflict_do_update(
            index_elements=[RecordMetadata.id],
            set_={
                "text": stmt.excluded.text,
                "article": stmt.excluded.article,
                "section": stmt.excluded.section,
                "pages": stmt.excluded.pages,
                "window_index": stmt.excluded.window_index,
                "total_windows": stmt.excluded.total_windows,
                "method": stmt.excluded.method,
                "word_count": stmt.excluded.word_count,
                "char_count": stmt.excluded.char_count,
                "law_name": stmt.excluded.law_name,
                "source_file": stmt.excluded.source_file,
                "doc_type": stmt.excluded.doc_type,
                "kanun_no": stmt.excluded.kanun_no,
                "resmi_gazete_tarihi": stmt.excluded.resmi_gazete_tarihi,
                "resmi_gazete_sayisi": stmt.excluded.resmi_gazete_sayisi,
                "kabul_tarihi": stmt.excluded.kabul_tarihi,
                "kurumlar": stmt.excluded.kurumlar,
                "kisiler": stmt.excluded.kisiler,
                "toplam_sayfa": stmt.excluded.toplam_sayfa,
                "extraction_date": stmt.excluded.extraction_date,
            },
        )
        await db.execute(stmt)
        await db.commit()


async def _flush_batch(records: List[Dict[str, Any]], chunks: List[Dict[str, Any]]) -> int:
    if not records and not chunks:
        return 0

    await _upsert_metadata(records)
    indexed = 0
    if chunks:
        indexed = await retrieval_service.index_chunks(chunks)
    records.clear()
    chunks.clear()
    return indexed


async def ingest_jsonl():
    jsonl_files = [f for f in os.listdir(JSONL_DIR) if f.endswith(".jsonl")]
    print(f"Found {len(jsonl_files)} JSONL files in {JSONL_DIR}")
    if not jsonl_files:
        print("No JSONL files found, exiting.")
        return

    if os.getenv("RESET_BEFORE_INGEST", "false").lower() == "true":
        async with SessionLocal() as db:
            await db.execute(text("DELETE FROM record_metadata"))
            await db.execute(text("DELETE FROM documents"))
            await db.execute(text("DELETE FROM audit_logs"))
            await db.commit()
        print("Database cleared (RESET_BEFORE_INGEST=true).")

    await retrieval_service.ensure_index()

    doc_map: Dict[str, str] = {}
    file_chunk_counts: Dict[str, int] = {}
    doc_rows: List[Dict[str, Any]] = []
    metadata_batch: List[Dict[str, Any]] = []
    chunk_batch: List[Dict[str, Any]] = []
    total_indexed = 0

    for j_file in jsonl_files:
        path = os.path.join(JSONL_DIR, j_file)
        print(f"Processing {j_file}...")

        with open(path, "r", encoding="utf-8") as f:
            for line in f:
                data = json.loads(line)
                filename = data.get("source_file", "unknown.pdf")

                if filename not in doc_map:
                    doc_id = _derive_doc_id(filename)
                    doc_map[filename] = doc_id
                    doc_rows.append(
                        {
                            "id": doc_id,
                            "filename": filename,
                            "status": "processing",
                            "size_bytes": 0,
                            "chunk_count": 0,
                        }
                    )

                doc_id = doc_map[filename]
                chunk_id = _derive_chunk_id(data, filename)
                metadata_batch.append(_build_record_dict(data, filename, chunk_id))
                chunk_batch.append(_build_chunk_payload(data, filename, doc_id, chunk_id))
                file_chunk_counts[filename] = file_chunk_counts.get(filename, 0) + 1

                if len(metadata_batch) >= BATCH_SIZE:
                    total_indexed += await _flush_batch(metadata_batch, chunk_batch)

    await _upsert_documents(doc_rows)

    if metadata_batch:
        total_indexed += await _flush_batch(metadata_batch, chunk_batch)

    for filename, doc_id in doc_map.items():
        async with SessionLocal() as db:
            await db.execute(
                text("UPDATE documents SET chunk_count = :chunk_count, status = 'indexed' WHERE id = :doc_id"),
                {"chunk_count": file_chunk_counts.get(filename, 0), "doc_id": doc_id},
            )
            await db.commit()

    print("\nIngestion complete!")
    print(f"Documents: {len(doc_map)}")
    print(f"Indexed chunks: {total_indexed}")


if __name__ == "__main__":
    asyncio.run(ingest_jsonl())
