"""
Document Service — PDF yükleme, parse, chunk başlatma
"""
import io
import os
import uuid
import aiofiles
import pdfplumber
from bs4 import BeautifulSoup
try:
    from docx import Document as DocxDocument
except ImportError:
    DocxDocument = None

from typing import List, Dict, Any, Optional
from datetime import datetime
from fastapi import BackgroundTasks
from app.core.logger import get_logger
from app.rag.chunking import chunk_by_paragraph
from app.db.models import Document, AuditLog
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.repository import DocumentRepository
from app.db.postgres import SessionLocal

logger = get_logger(__name__)


class DocumentService:
    async def list_documents(self, db: Optional[AsyncSession] = None) -> List[Dict[str, Any]]:
        if db is not None:
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
        async with SessionLocal() as db_session:
            repo = DocumentRepository(db_session)
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
        background_tasks: BackgroundTasks,
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

        raw_dir = os.getenv("DATA_DIR", "/app/data/raw_pdfs")
        os.makedirs(raw_dir, exist_ok=True)
        filepath = os.path.join(raw_dir, f"{doc_id}.pdf")
        async with aiofiles.open(filepath, "wb") as f:
            await f.write(content)

        # Arka plan görevini (BackgroundTasks) kuyruğa ekle
        background_tasks.add_task(
            self._process_document_task,
            doc_id, filename, content, content_type
        )

        return {**doc_data, "status": "processing"}

    async def _process_document_task(self, doc_id: str, filename: str, content: bytes, content_type: str):
        try:
            # PDF için sayfa sayfa işle (page numarası chunk'a eklenir)
            if content_type not in ("text/plain", "text/html") and "wordprocessingml" not in (content_type or ""):
                chunks = self._parse_pdf_with_pages(content, doc_id=doc_id, filename=filename)
            else:
                text = self._parse(content, content_type)
                chunks = chunk_by_paragraph(text, doc_id=doc_id, filename=filename)

            from app.services.retrieval_service import retrieval_service
            indexed = await retrieval_service.index_chunks(chunks)

            # PageIndex (Vektörsüz RAG) Oluşturma ve Kaydetme
            try:
                from scripts.build_pageindex import process_pdf
                raw_dir = os.getenv("DATA_DIR", "/app/data/raw_pdfs")
                pdf_path = os.path.join(raw_dir, f"{doc_id}.pdf")
                if os.path.exists(pdf_path):
                    await process_pdf(pdf_path)
                    logger.info(f"[DocService] {filename} için PageIndex başarıyla oluşturuldu.")
            except Exception as e_pageindex:
                logger.error(f"[DocService] {filename} için PageIndex oluşturulurken hata: {e_pageindex}", exc_info=True)

            from sqlalchemy import text
            async with SessionLocal() as db:
                await db.execute(
                    text("UPDATE documents SET status = 'indexed', chunk_count = :count WHERE id = :id"),
                    {"count": indexed, "id": doc_id}
                )
                await db.commit()
                
            logger.info(f"[DocService] {filename} → {indexed} chunk indekslendi")
        except Exception as e:
            from sqlalchemy import text
            async with SessionLocal() as db:
                await db.execute(
                    text("UPDATE documents SET status = 'error' WHERE id = :id"),
                    {"id": doc_id}
                )
                await db.commit()
            logger.error(f"[DocService] {filename} işleme hatası: {e}")

    def _parse(self, content: bytes, content_type: str) -> str:
        # Plain text
        if content_type == "text/plain":
            return content.decode("utf-8", errors="replace")

        # HTML
        if content_type == "text/html":
            soup = BeautifulSoup(content, "html.parser")
            return soup.get_text(separator="\n", strip=True)

        # DOCX
        if "wordprocessingml" in (content_type or "") or content_type == "application/octet-stream":
            if DocxDocument is not None:
                doc = DocxDocument(io.BytesIO(content))
                paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
                return "\n\n".join(paragraphs)
            else:
                logger.warning("[DocService] python-docx yüklü değil, metin çıkarılamadı")
                return ""

        # PDF (default)
        try:
            with pdfplumber.open(io.BytesIO(content)) as pdf:
                pages = []
                for page in pdf.pages:
                    text = page.extract_text()
                    if text:
                        pages.append(text)
                return "\n\n".join(pages)
        except Exception as e:
            logger.warning(f"[DocService] pdfplumber hatası: {e}, raw decode deneniyor")
            return content.decode("utf-8", errors="replace")

    def _parse_pdf_with_pages(
        self,
        content: bytes,
        doc_id: str,
        filename: str,
    ) -> List[Dict[str, Any]]:
        """
        PDF'i sayfa sayfa parse eder ve her chunk'a page numarası ekler.
        retrieval_service'teki h.get("page") bu bilgiyi kullanır.
        """
        all_chunks: List[Dict[str, Any]] = []
        try:
            with pdfplumber.open(io.BytesIO(content)) as pdf:
                for page_num, page in enumerate(pdf.pages, start=1):
                    text = page.extract_text()
                    if not text or not text.strip():
                        continue
                    page_chunks = chunk_by_paragraph(
                        text,
                        doc_id=doc_id,
                        filename=filename,
                        page=page_num,
                    )
                    all_chunks.extend(page_chunks)
        except Exception as e:
            logger.warning(f"[DocService] _parse_pdf_with_pages hatası: {e}, sayfa bilgisiz fallback")
            text = content.decode("utf-8", errors="replace")
            all_chunks = chunk_by_paragraph(text, doc_id=doc_id, filename=filename)
        return all_chunks

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

    async def get_document_chunks(self, doc_id: str) -> List[Dict[str, Any]]:
        from app.vectorstore.opensearch_client import opensearch_client
        return await opensearch_client.get_chunks_by_doc_id(doc_id)


document_service = DocumentService()

