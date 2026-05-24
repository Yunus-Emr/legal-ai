import asyncio
import json
import os
import sys
import hashlib
import uuid

# Ensure backend module path is available in both host and container environments
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend')))

from app.core.logger import get_logger
from app.core.config import settings
from app.vectorstore.opensearch_client import opensearch_client
from app.vectorstore.schema import LEGAL_INDEX_MAPPING
from app.services.retrieval_service import retrieval_service
from app.db.postgres import SessionLocal
from app.db.models import Document
from sqlalchemy import select

logger = get_logger(__name__)

async def recreate_index():
    client = opensearch_client._get_client()
    if client is None:
        logger.error("OpenSearch Client cannot be initialized. Ensure opensearch-py is installed and server is running.")
        return
        
    index_name = settings.OPENSEARCH_INDEX
    exists = await client.indices.exists(index=index_name)
    if exists:
        logger.info(f"Yeniden oluşturmak için '{index_name}' siliniyor...")
        await client.indices.delete(index=index_name)
        
    await client.indices.create(index=index_name, body=LEGAL_INDEX_MAPPING)
    logger.info(f"OpenSearch index '{index_name}' text-embedding-3-small KNN şeması (dim: 1536) ile oluşturuldu.")

async def main():
    await recreate_index()
    chunks_path = os.path.join(os.path.dirname(__file__), "..", "data", "chunks", "chunks.jsonl")
    if not os.path.exists(chunks_path):
        logger.warning(f"Data file {chunks_path} bulunamadı!")
        return

    logger.info("JSONL array okunuyor...")
    chunks = []
    with open(chunks_path, "r", encoding="utf-8") as f:
        for line in f:
            if line.strip():
                try:
                    c = json.loads(line)
                    raw_pages = c.get("pages", [])
                    page_val = raw_pages[0] if isinstance(raw_pages, list) and raw_pages else 0
                    
                    chunks.append({
                        "chunk_id": c.get("chunk_id", ""),
                        "doc_id": c.get("chunk_id", ""),
                        "document_name": c.get("source_file", c.get("law_name", "Unknown")),
                        "text": c.get("text", ""),
                        "page": page_val
                    })
                except Exception as e:
                    pass
    
    logger.info(f"Embedding ve Indexing başlıyor ({len(chunks)} chunk) text-embedding-3-small model ile...")
    batch_size = 50
    for i in range(0, len(chunks), batch_size):
        batch = chunks[i:i+batch_size]
        await retrieval_service.index_chunks(batch)
        logger.info(f"Indexer batch tamamlandı: {i+len(batch)}/{len(chunks)}")
        
    logger.info("Tüm veriler text-embedding-3-small standartlarıyla OpenSearch'e gönderildi!")

    # PostgreSQL'e dokümanları kaydet/senkronize et
    doc_groups = {}
    for c in chunks:
        doc_name = c["document_name"]
        if doc_name not in doc_groups:
            doc_groups[doc_name] = {
                "chunk_count": 0,
                "text_length": 0
            }
        doc_groups[doc_name]["chunk_count"] += 1
        doc_groups[doc_name]["text_length"] += len(c["text"])

    logger.info(f"PostgreSQL ile senkronizasyon başlıyor ({len(doc_groups)} benzersiz doküman)...")
    async with SessionLocal() as db:
        for doc_name, info in doc_groups.items():
            # Benzersiz ve sabit bir UUID oluştur (isimden türetilmiş md5 hash bazlı)
            doc_uuid = str(uuid.uuid5(uuid.NAMESPACE_DNS, doc_name))
            
            # Veritabanında var mı kontrol et
            result = await db.execute(select(Document).where(Document.filename == doc_name))
            existing_doc = result.scalar_one_or_none()
            
            if existing_doc:
                existing_doc.chunk_count = info["chunk_count"]
                existing_doc.size_bytes = info["text_length"] * 2 # Yaklaşık byte boyutu
                existing_doc.status = "indexed"
                logger.info(f"Doküman güncellendi: '{doc_name}' ({info['chunk_count']} chunk)")
            else:
                new_doc = Document(
                    id=doc_uuid,
                    filename=doc_name,
                    size_bytes=info["text_length"] * 2,
                    chunk_count=info["chunk_count"],
                    status="indexed",
                    user_id=None
                )
                db.add(new_doc)
                logger.info(f"Yeni doküman eklendi: '{doc_name}' ({info['chunk_count']} chunk)")
        
        await db.commit()
    logger.info("PostgreSQL senkronizasyonu başarıyla tamamlandı!")

if __name__ == "__main__":
    asyncio.run(main())
