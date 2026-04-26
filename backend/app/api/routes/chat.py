import uuid
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Any
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.postgres import get_db
from app.db.models import ChatHistory
from app.core.security import get_current_user
from app.db.models import User
from app.services.rag_service import rag_service
from app.core.logger import get_logger

logger = get_logger(__name__)
router = APIRouter()


class ChatRequest(BaseModel):
    query: str
    session_id: Optional[str] = None


class SourceResult(BaseModel):
    document_name: str
    chunk_id: Optional[str] = None
    page: Optional[int] = None
    score: Optional[float] = None


class ChatResponse(BaseModel):
    answer: str
    sources: List[SourceResult]
    session_id: str
    query: str

@router.post("/chat", response_model=ChatResponse)
async def chat(
    req: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Kullanıcı sorusunu alır, RAG pipeline üzerinden yanıt üretir.
    """
    if not req.query.strip():
        raise HTTPException(status_code=400, detail="Soru boş olamaz")

    session_id = req.session_id or str(uuid.uuid4())
    logger.info(f"[Chat] session={session_id} query={req.query[:80]}")

    try:
        import time
        start_time = time.time()
        result = await rag_service.ask(query=req.query, session_id=session_id)
        duration_ms = int((time.time() - start_time) * 1000)
        
        from app.db.models import QueryLog, AuditLog
        
        chat_q = ChatHistory(
            id=str(uuid.uuid4()),
            session_id=session_id,
            role="user",
            content=req.query,
            user_id=current_user.id
        )
        chat_a = ChatHistory(
            id=str(uuid.uuid4()),
            session_id=session_id,
            role="assistant",
            content=result["answer"],
            user_id=current_user.id
        )
        
        q_log = QueryLog(
            id=str(uuid.uuid4()),
            session_id=session_id,
            query=req.query,
            answer=result["answer"],
            response_time_ms=duration_ms
        )
        
        audit = AuditLog(
            id=str(uuid.uuid4()),
            user_id=current_user.id,
            action="query",
            details={"session_id": session_id, "query": req.query[:100]}
        )
        
        db.add_all([chat_q, chat_a, q_log, audit])
        await db.commit()

        return ChatResponse(
            answer=result["answer"],
            sources=result["sources"],
            session_id=session_id,
            query=req.query,
        )
    except Exception as e:
        logger.error(f"[Chat] Hata: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/chat/sessions")
async def get_chat_sessions(
    current_user: User = Depends(get_current_user), 
    db: AsyncSession = Depends(get_db)
):
    from sqlalchemy import select
    result = await db.execute(
        select(ChatHistory.session_id, ChatHistory.created_at)
        .where(ChatHistory.user_id == current_user.id)
        .order_by(ChatHistory.created_at.desc())
    )
    sessions = []
    seen = set()
    for row in result.all():
        if row.session_id not in seen:
            seen.add(row.session_id)
            sessions.append({"session_id": row.session_id, "last_activity": row.created_at})
    return {"sessions": sessions}

@router.get("/chat/{session_id}")
async def get_chat_history(
    session_id: str, 
    current_user: User = Depends(get_current_user), 
    db: AsyncSession = Depends(get_db)
):
    from sqlalchemy import select
    result = await db.execute(
        select(ChatHistory)
        .where((ChatHistory.session_id == session_id) & (ChatHistory.user_id == current_user.id))
        .order_by(ChatHistory.created_at.asc())
    )
    history = [{"role": h.role, "content": h.content, "created_at": h.created_at} for h in result.scalars().all()]
    return {"session_id": session_id, "history": history}
