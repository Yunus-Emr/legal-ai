"""
Document Service — PDF yükleme, parse, chunk başlatma
"""
import io
import os
import uuid
from typing import List, Dict, Any, Optional
from datetime import datetime
from app.core.logger import get_logger
from app.rag.chunking import chunk_text
from app.db.models import Document, AuditLog
from app.db.repository import DocumentRepository
from app.db.postgres import SessionLocal

logger = get_logger(__name__)


class DocumentService:
    async def list_documents(self) -> List[Dict[str, Any]]:
        async with SessionLocal() as db:
            repo = DocumentRepository(db)
            docs = await repo.list_all()
            return [
                {
                    "id": d.id,
                    "filename": d.filename,
                    "size_bytes": d.size_bytes,
                    "chunk_count": d.chunk_count,
                    "status": d.status,
                    "created_at": d.created_at.isoformat(),
                }
                for d in docs
            ]

    async def process_document(
        self,
        doc_id: str,
        filename: str,
        content: bytes,
        content_type: str,
        user_id: Optional[str] = None
    ) -> Dict[str, Any]:
        doc_data = {
            "id": doc_id,
            "filename": filename,
            "size_bytes": len(content),
            "chunk_count": 0,
            "status": "processing",
            "user_id": user_id
        }

        async with SessionLocal() as db:
            repo = DocumentRepository(db)
            await repo.create(doc_data)
            
            # Audit Log
            audit = AuditLog(
                id=str(uuid.uuid4()),
                user_id=user_id,
                action="document_upload",
                details={"filename": filename, "doc_id": doc_id}
            )
            db.add(audit)
            await db.commit()

        # Save to disk
        raw_dir = "/home/yunus/TestFolder/legal-ai/data/raw_pdfs"
        os.makedirs(raw_dir, exist_ok=True)
        filepath = os.path.join(raw_dir, f"{doc_id}.pdf")
        with open(filepath, "wb") as f:
            f.write(content)

        try:
            text = self._parse(content, content_type)
            chunks = chunk_text(text, doc_id=doc_id, filename=filename)

            from app.services.retrieval_service import retrieval_service
            indexed = await retrieval_service.index_chunks(chunks)

            async with SessionLocal() as db:
                await db.execute(
                    "UPDATE documents SET status = 'indexed', chunk_count = :count WHERE id = :id",
                    {"count": indexed, "id": doc_id}
                )
                await db.commit()
                
            logger.info(f"[DocService] {filename} → {indexed} chunk indekslendi")
        except Exception as e:
            async with SessionLocal() as db:
                await db.execute(
                    "UPDATE documents SET status = 'error' WHERE id = :id",
                    {"id": doc_id}
                )
                await db.commit()
            logger.error(f"[DocService] {filename} işleme hatası: {e}")
            raise

        return {**doc_data, "chunk_count": indexed if 'indexed' in locals() else 0, "status": "indexed"}

    def _parse(self, content: bytes, content_type: str) -> str:
        # Plain text
        if content_type == "text/plain":
            return content.decode("utf-8", errors="replace")

        # HTML
        if content_type == "text/html":
            try:
                from bs4 import BeautifulSoup
                soup = BeautifulSoup(content, "html.parser")
                return soup.get_text(separator="\n", strip=True)
            except ImportError:
                return content.decode("utf-8", errors="replace")

        # DOCX
        if "wordprocessingml" in (content_type or "") or content_type == "application/octet-stream":
            try:
                import io
                from docx import Document as DocxDocument
                doc = DocxDocument(io.BytesIO(content))
                paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
                return "\n\n".join(paragraphs)
            except ImportError:
                logger.warning("[DocService] python-docx yüklü değil, metin çıkarılamadı")
                return ""

        # PDF (default)
        try:
            import pdfplumber
            with pdfplumber.open(io.BytesIO(content)) as pdf:
                pages = []
                for page in pdf.pages:
                    text = page.extract_text()
                    if text:
                        pages.append(text)
                return "\n\n".join(pages)
        except Exception:
            try:
                import PyPDF2
                reader = PyPDF2.PdfReader(io.BytesIO(content))
                pages = [p.extract_text() or "" for p in reader.pages]
                return "\n\n".join(pages)
            except Exception:
                return content.decode("utf-8", errors="replace")

    async def delete_document(self, doc_id: str) -> None:
        async with SessionLocal() as db:
            repo = DocumentRepository(db)
            await repo.delete(doc_id)
            await db.commit()
            
        try:
            from app.services.retrieval_service import retrieval_service
            from app.vectorstore.opensearch_client import opensearch_client
            await opensearch_client.delete_by_doc_id(doc_id)
        except Exception as e:
            logger.warning(f"[DocService] OpenSearch silme hatası: {e}")

    async def get_status(self, doc_id: str) -> Optional[Dict[str, Any]]:
        async with SessionLocal() as db:
            repo = DocumentRepository(db)
            doc = await repo.get(doc_id)
            if not doc:
                return None
            return {
                "id": doc.id,
                "status": doc.status,
                "chunk_count": doc.chunk_count
            }


document_service = DocumentService()
