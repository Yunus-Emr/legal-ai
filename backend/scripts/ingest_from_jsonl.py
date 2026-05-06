import asyncio
import json
import os
import uuid
from sqlalchemy import text
from app.db.postgres import SessionLocal
from app.services.retrieval_service import retrieval_service
from app.db.models import Document, RecordMetadata

async def ingest_jsonl():
    jsonl_dir = "/home/yunus/TestFolder/legal-ai/data/chunks"
    jsonl_files = [f for f in os.listdir(jsonl_dir) if f.endswith(".jsonl")]
    print(f"Found {len(jsonl_files)} JSONL files in {jsonl_dir}")

    # 1. Clear existing
    async with SessionLocal() as db:
        await db.execute(text("DELETE FROM record_metadata"))
        await db.execute(text("DELETE FROM documents"))
        await db.execute(text("DELETE FROM audit_logs"))
        await db.commit()
    print("Database cleared.")

    # Reset OpenSearch
    try:
        from app.vectorstore.opensearch_client import opensearch_client
        await opensearch_client.client.indices.delete(index="legal_chunks", ignore=[400, 404])
        print("OpenSearch index cleared.")
    except Exception as e:
        print(f"OpenSearch clear error: {e}")

    doc_map = {} # filename -> doc_id

    for j_file in jsonl_files:
        path = os.path.join(jsonl_dir, j_file)
        print(f"Processing {j_file}...")
        
        chunks_to_index = []
        
        with open(path, "r", encoding="utf-8") as f:
            for line in f:
                data = json.loads(line)
                filename = data.get("source_file", "unknown.pdf")
                
                if filename not in doc_map:
                    doc_id = str(uuid.uuid4())
                    doc_map[filename] = doc_id
                    async with SessionLocal() as db:
                        db.add(Document(
                            id=doc_id,
                            filename=filename,
                            status="indexed",
                            size_bytes=0, # Unknown from jsonl
                            chunk_count=0
                        ))
                        await db.commit()
                
                doc_id = doc_map[filename]
                
                # Prepare for SQL
                record_id = data.get("chunk_id", str(uuid.uuid4()))
                record = RecordMetadata(
                    id=record_id,
                    text=data.get("text", ""),
                    article=data.get("article"),
                    section=data.get("section"),
                    pages=data.get("pages"),
                    window_index=data.get("window_index"),
                    total_windows=data.get("total_windows"),
                    method=data.get("method"),
                    word_count=data.get("word_count"),
                    char_count=data.get("char_count"),
                    law_name=data.get("law_name"),
                    source_file=filename,
                    doc_type=data.get("doc_type"),
                    kanun_no=data.get("kanun_no"),
                    resmi_gazete_tarihi=data.get("resmi_gazete_tarihi"),
                    resmi_gazete_sayisi=data.get("resmi_gazete_sayisi"),
                    kabul_tarihi=data.get("kabul_tarihi"),
                    kurumlar=data.get("kurumlar"),
                    kisiler=data.get("kisiler"),
                    toplam_sayfa=data.get("toplam_sayfa"),
                    extraction_date=None # datetime logic needed if we want it
                )
                
                chunks_to_index.append({
                    "id": record_id,
                    "doc_id": doc_id,
                    "text": data.get("text", ""),
                    "metadata": {
                        "source": filename,
                        "article": data.get("article"),
                        "section": data.get("section"),
                        "law_name": data.get("law_name")
                    }
                })
                
                async with SessionLocal() as db:
                    db.add(record)
                    await db.commit()
        
        # Batch index in OpenSearch
        if chunks_to_index:
            print(f"Indexing {len(chunks_to_index)} chunks from {j_file} to OpenSearch...")
            indexed_count = await retrieval_service.index_chunks(chunks_to_index)
            print(f"Finished {j_file}: {indexed_count} chunks.")

    print("\nIngestion complete!")

if __name__ == "__main__":
    import sys
    sys.path.append(os.getcwd())
    asyncio.run(ingest_jsonl())
