import asyncio
import json
import os
import sys

# Ensure backend module path is available
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend')))

from app.core.logger import get_logger
from app.core.config import settings
from app.vectorstore.opensearch_client import opensearch_client
from app.vectorstore.schema import LEGAL_INDEX_MAPPING
from app.services.retrieval_service import retrieval_service

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
    logger.info(f"OpenSearch index '{index_name}' e5-large KNN şeması (dim: 1024) ile oluşturuldu.")

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
    
    logger.info(f"Embedding ve Indexing başlıyor ({len(chunks)} chunk) e5-large model ile...")
    batch_size = 50
    for i in range(0, len(chunks), batch_size):
        batch = chunks[i:i+batch_size]
        await retrieval_service.index_chunks(batch)
        logger.info(f"Indexer batch tamamlandı: {i+len(batch)}/{len(chunks)}")
        
    logger.info("Tüm veriler e5-large standartlarıyla OpenSearch'e gönderildi!")

if __name__ == "__main__":
    asyncio.run(main())
