import asyncio
import os
import uuid
from app.services.document_service import document_service
from app.db.postgres import SessionLocal

async def seed_data():
    raw_dir = "/home/yunus/TestFolder/legal-ai/data/raw_pdfs"
    if not os.path.exists(raw_dir):
        print(f"Error: {raw_dir} not found")
        return

    files = [f for f in os.listdir(raw_dir) if f.endswith(".pdf")]
    print(f"Found {len(files)} PDFs in {raw_dir}")

    for filename in files:
        filepath = os.path.join(raw_dir, filename)
        doc_id = str(uuid.uuid4())
        
        print(f"Processing {filename}...")
        
        with open(filepath, "rb") as f:
            content = f.read()
            
        try:
            # We bypass the 'upload' part since they are already on disk
            # but we use process_document to handle parsing, chunking, and indexing
            result = await document_service.process_document(
                doc_id=doc_id,
                filename=filename,
                content=content,
                content_type="application/pdf"
            )
            print(f"Successfully indexed {filename}: {result['chunk_count']} chunks")
        except Exception as e:
            print(f"Failed to process {filename}: {e}")

if __name__ == "__main__":
    # Ensure we are in the right directory to import app
    import sys
    sys.path.append(os.getcwd())
    asyncio.run(seed_data())
