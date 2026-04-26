import os
import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import JSONResponse, FileResponse
from typing import List
from app.core.security import get_current_user
from app.db.models import User
from app.services.document_service import document_service
from app.core.logger import get_logger

logger = get_logger(__name__)
router = APIRouter()

ALLOWED_TYPES = {"application/pdf", "text/plain"}
MAX_SIZE_MB = 50


@router.get("/documents")
async def list_documents(current_user: User = Depends(get_current_user)):
    """Yüklenmiş dokümanları listeler."""
    docs = await document_service.list_documents()
    return {"documents": docs}


@router.post("/documents/upload")
async def upload_documents(
    files: List[UploadFile] = File(...),
    current_user: User = Depends(get_current_user),
):
    """PDF dosyası yükler, parse eder ve indeksler."""
    results = []
    for f in files:
        if f.content_type not in ALLOWED_TYPES:
            raise HTTPException(
                status_code=400,
                detail=f"{f.filename}: Yalnızca PDF ve TXT desteklenir",
            )

        content = await f.read()
        size_mb = len(content) / (1024 * 1024)
        if size_mb > MAX_SIZE_MB:
            raise HTTPException(
                status_code=413,
                detail=f"{f.filename}: {MAX_SIZE_MB} MB sınırını aşıyor",
            )

        doc_id = str(uuid.uuid4())
        logger.info(f"[Upload] {f.filename} ({size_mb:.1f} MB) → id={doc_id}")

        try:
            result = await document_service.process_document(
                doc_id=doc_id,
                filename=f.filename or "upload.pdf",
                content=content,
                content_type=f.content_type or "application/pdf",
            )
            results.append(result)
        except Exception as e:
            logger.error(f"[Upload] {f.filename} işleme hatası: {e}")
            raise HTTPException(status_code=500, detail=str(e))

    return {"uploaded": len(results), "documents": results}


@router.delete("/documents/{doc_id}")
async def delete_document(doc_id: str, current_user: User = Depends(get_current_user)):
    """Dokümanı ve ilgili chunk'ları siler."""
    try:
        await document_service.delete_document(doc_id)
        return {"deleted": doc_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/documents/{doc_id}/status")
async def get_document_status(doc_id: str, current_user: User = Depends(get_current_user)):
    """Doküman işleme durumunu döner."""
    status = await document_service.get_status(doc_id)
    if not status:
        raise HTTPException(status_code=404, detail="Doküman bulunamadı")
    return status

@router.get("/documents/{doc_id}/download")
async def download_document(doc_id: str, current_user: User = Depends(get_current_user)):
    import os
    filepath = f"/home/yunus/TestFolder/legal-ai/data/raw_pdfs/{doc_id}.pdf"
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="Doküman diske kaydedilmemiş")
    return FileResponse(filepath, media_type="application/pdf", filename=f"{doc_id}.pdf")
