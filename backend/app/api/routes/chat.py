import uuid
from fastapi import APIRouter, Depends, HTTPException, Request, Cookie
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
from typing import Optional, List, Any
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.postgres import get_db
from app.db.models import User
from app.db.repository import ChatRepository, QueryLogRepository, AuditLogRepository
from app.core.security import get_current_user as get_current_user_required
from app.services.rag_service import rag_service
from app.core.logger import get_logger
from app.core.rate_limit import limiter

logger = get_logger(__name__)
router = APIRouter()

# Optional auth — returns None for unauthenticated (guest) requests
oauth2_optional = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)

async def get_optional_user(
    request: Request,
    bearer_token: Optional[str] = Depends(oauth2_optional),
    cookie_token: Optional[str] = Cookie(alias="lexai_token", default=None),
    db: AsyncSession = Depends(get_db),
) -> Optional[User]:
    """Cookie veya Bearer header'dan user döner, yoksa None (guest)."""
    token = cookie_token or bearer_token
    if not token:
        return None
    try:
        from jose import jwt, JWTError
        from app.services.auth_service import SECRET_KEY, ALGORITHM
        from app.db.repository import UserRepository
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") == "refresh":
            return None
        user_id: str = payload.get("sub")
        if not user_id:
            return None
        repo = UserRepository(db)
        return await repo.get(user_id)
    except Exception:
        return None


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
    is_guest: bool = False

@router.post("/chat", response_model=ChatResponse)
@limiter.limit("30/minute")
async def chat(
    request: Request,
    req: ChatRequest,
    current_user: Optional[User] = Depends(get_optional_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Kullanıcı sorusunu alır, RAG pipeline üzerinden yanıt üretir.
    Guest kullanıcılar (giriş yapmamış) da sorgulayabilir — DB'ye kayıt atılmaz.
    """
    if not req.query.strip():
        raise HTTPException(status_code=400, detail="Soru boş olamaz")

    is_guest = current_user is None
    session_id = req.session_id or str(uuid.uuid4())
    logger.info(f"[Chat] {'GUEST' if is_guest else current_user.id} session={session_id} query={req.query[:80]}")

    try:
        import time
        start_time = time.time()

        chat_repo = ChatRepository(db)
        qlog_repo = QueryLogRepository(db)
        audit_repo = AuditLogRepository(db)

        # Fetch conversation history for memory (authenticated only)
        history: list = []
        if not is_guest and session_id:
            history = await chat_repo.get_recent_history(session_id)

        result = await rag_service.ask(
            query=req.query, session_id=session_id, history=history, db=db
        )
        duration_ms = int((time.time() - start_time) * 1000)

        # Only persist to DB for authenticated users
        if not is_guest:
            sources_list = [
                {"document_name": s.get("document_name"), "chunk_id": s.get("chunk_id"), "score": s.get("score")}
                for s in result.get("sources", [])
            ]
            await chat_repo.add_turn(
                session_id=session_id,
                query=req.query,
                answer=result["answer"],
                user_id=current_user.id,
            )
            await qlog_repo.log(
                session_id=session_id,
                query=req.query,
                answer=result["answer"],
                response_time_ms=duration_ms,
                sources=sources_list,
            )
            await audit_repo.log(
                action="query",
                user_id=current_user.id,
                details={"session_id": session_id, "query": req.query[:100]},
            )
            await db.commit()

        return ChatResponse(
            answer=result["answer"],
            sources=result["sources"],
            session_id=session_id,
            query=req.query,
            is_guest=is_guest,
        )
    except Exception as e:
        logger.error(f"[Chat] Hata: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# ── SSE Streaming endpoint ──────────────────────────────────────
import json as _json
from fastapi.responses import StreamingResponse as _StreamingResponse

@router.post("/chat/stream")
async def chat_stream(
    req: ChatRequest,
    current_user: Optional[User] = Depends(get_optional_user),
    db: AsyncSession = Depends(get_db),
):
    """Server-Sent Events endpoint — token by token streaming."""
    if not req.query.strip():
        raise HTTPException(status_code=400, detail="Soru boş olamaz")

    is_guest = current_user is None
    session_id = req.session_id or str(uuid.uuid4())

    async def event_stream():
        try:
            import time
            yield f"data: {_json.dumps({'type': 'session', 'session_id': session_id})}\n\n"

            # Fetch history
            history: list = []
            if not is_guest and session_id:
                chat_repo_h = ChatRepository(db)
                history = await chat_repo_h.get_recent_history(session_id)

            start_time = time.time()
            full_answer = ""
            sources = []

            # Tüm RAG mantığı ask_stream() içinde — DRY
            async for event in rag_service.ask_stream(
                query=req.query,
                session_id=session_id,
                history=history,
                db=db,
            ):
                if event["type"] == "sources":
                    sources = event["sources"]
                    yield f"data: {_json.dumps({'type': 'sources', 'sources': sources})}\n\n"
                elif event["type"] == "token":
                    full_answer += event["token"]
                    yield f"data: {_json.dumps({'type': 'token', 'token': event['token']})}\n\n"
                elif event["type"] == "done":
                    pass  # done sonunda gönderilecek

            duration_ms = int((time.time() - start_time) * 1000)

            # Persist if authenticated
            if not is_guest:
                chat_repo2 = ChatRepository(db)
                qlog_repo  = QueryLogRepository(db)
                audit_repo = AuditLogRepository(db)
                await chat_repo2.add_turn(
                    session_id=session_id,
                    query=req.query,
                    answer=full_answer,
                    user_id=current_user.id,
                )
                await qlog_repo.log(
                    session_id=session_id,
                    query=req.query,
                    answer=full_answer,
                    response_time_ms=duration_ms,
                    sources=[{"document_name": s.get("document_name"), "chunk_id": s.get("chunk_id"), "score": s.get("score")} for s in sources],
                )
                await audit_repo.log(
                    action="stream_query",
                    user_id=current_user.id,
                    details={"session_id": session_id},
                )
                await db.commit()

            yield f"data: {_json.dumps({'type': 'done'})}\n\n"

        except Exception as e:
            yield f"data: {_json.dumps({'type': 'error', 'message': str(e)})}\n\n"

    return _StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )

@router.get("/chat/sessions")
async def get_chat_sessions(
    current_user: User = Depends(get_current_user_required),
    db: AsyncSession = Depends(get_db)
):
    chat_repo = ChatRepository(db)
    sessions = await chat_repo.get_sessions_by_user(current_user.id)
    return {"sessions": sessions}

@router.get("/chat/{session_id}")
async def get_chat_history(
    session_id: str,
    current_user: User = Depends(get_current_user_required),
    db: AsyncSession = Depends(get_db)
):
    chat_repo = ChatRepository(db)
    messages = await chat_repo.get_history(session_id, user_id=current_user.id)
    history = [{"role": h.role, "content": h.content, "created_at": h.created_at} for h in messages]
    return {"session_id": session_id, "history": history}
