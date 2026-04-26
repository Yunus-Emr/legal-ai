from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from app.core.security import get_api_key
from app.services.retrieval_service import retrieval_service
from app.core.logger import get_logger

logger = get_logger(__name__)
router = APIRouter()


class SearchRequest(BaseModel):
    query: str
    top_k: int = 5
    document_ids: Optional[List[str]] = None


class SearchHit(BaseModel):
    chunk_id: str
    document_name: str
    text: str
    score: float
    page: Optional[int] = None


class SearchResponse(BaseModel):
    query: str
    results: List[SearchHit]
    total: int


@router.post("/search", response_model=SearchResponse)
async def search(
    req: SearchRequest,
    _: str = Depends(get_api_key),
):
    """Dokümanlar üzerinde semantik vektör araması yapar."""
    if not req.query.strip():
        raise HTTPException(status_code=400, detail="Sorgu boş olamaz")
    if req.top_k > 20:
        raise HTTPException(status_code=400, detail="top_k en fazla 20 olabilir")

    logger.info(f"[Search] query={req.query[:60]} top_k={req.top_k}")

    try:
        hits = await retrieval_service.search(
            query=req.query,
            top_k=req.top_k,
            filter_doc_ids=req.document_ids,
        )
        return SearchResponse(query=req.query, results=hits, total=len(hits))
    except Exception as e:
        logger.error(f"[Search] hata: {e}")
        raise HTTPException(status_code=500, detail="Arama servisi yanıt veremedi")
