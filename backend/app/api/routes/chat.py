import uuid
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
from typing import Optional, List, Any
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.postgres import get_db
from app.db.models import ChatHistory
from app.db.models import User
from app.core.security import get_current_user as get_current_user_required
from app.services.rag_service import rag_service
from app.core.logger import get_logger

logger = get_logger(__name__)
router = APIRouter()

# Optional auth — returns None for unauthenticated (guest) requests
oauth2_optional = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)

async def get_optional_user(
    token: Optional[str] = Depends(oauth2_optional),
    db: AsyncSession = Depends(get_db),
) -> Optional[User]:
    """Returns User if authenticated, None if guest."""
    if not token:
        return None
    try:
        from app.core.security import get_current_user
        from fastapi import Request
        from fastapi.security import HTTPAuthorizationCredentials
        from jose import jwt, JWTError
        from app.services.auth_service import SECRET_KEY, ALGORITHM
        from app.db.repository import UserRepository
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
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
async def chat(
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
        from sqlalchemy import select as sa_select

        start_time = time.time()

        # Fetch conversation history for memory (authenticated only)
        history: list = []
        if not is_guest and session_id:
            hist_result = await db.execute(
                sa_select(ChatHistory.role, ChatHistory.content)
                .where(ChatHistory.session_id == session_id)
                .order_by(ChatHistory.created_at.desc())
                .limit(8)
            )
            history = [
                {"role": r, "content": c}
                for r, c in reversed(hist_result.all())
            ]

        result = await rag_service.ask(
            query=req.query, session_id=session_id, history=history
        )
        duration_ms = int((time.time() - start_time) * 1000)

        # Only persist to DB for authenticated users
        if not is_guest:
            from app.db.models import QueryLog, AuditLog
            chat_q = ChatHistory(
                id=str(uuid.uuid4()), session_id=session_id,
                role="user", content=req.query, user_id=current_user.id
            )
            chat_a = ChatHistory(
                id=str(uuid.uuid4()), session_id=session_id,
                role="assistant", content=result["answer"], user_id=current_user.id
            )
            q_log = QueryLog(
                id=str(uuid.uuid4()), session_id=session_id,
                query=req.query, answer=result["answer"], response_time_ms=duration_ms
            )
            audit = AuditLog(
                id=str(uuid.uuid4()), user_id=current_user.id,
                action="query", details={"session_id": session_id, "query": req.query[:100]}
            )
            db.add_all([chat_q, chat_a, q_log, audit])
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
            # Send session_id first
            yield f"data: {_json.dumps({'type': 'session', 'session_id': session_id})}\n\n"

            # Fetch history
            history: list = []
            if not is_guest and session_id:
                from sqlalchemy import select as sa_select2
                hist_result = await db.execute(
                    sa_select2(ChatHistory.role, ChatHistory.content)
                    .where(ChatHistory.session_id == session_id)
                    .order_by(ChatHistory.created_at.desc())
                    .limit(8)
                )
                history = [{"role": r, "content": c} for r, c in reversed(hist_result.all())]

            import time
            start_time = time.time()
            result = await rag_service.ask(query=req.query, session_id=session_id, history=history)
            duration_ms = int((time.time() - start_time) * 1000)

            # Simulate token streaming (split answer into words)
            words = result["answer"].split(" ")
            buffer = ""
            for i, word in enumerate(words):
                buffer += word + (" " if i < len(words) - 1 else "")
                if i % 3 == 0 or i == len(words) - 1:
                    yield f"data: {_json.dumps({'type': 'token', 'token': buffer})}\n\n"
                    buffer = ""
                    import asyncio
                    await asyncio.sleep(0.02)

            # Send sources
            yield f"data: {_json.dumps({'type': 'sources', 'sources': result['sources']})}\n\n"

            # Persist if authenticated
            if not is_guest:
                from app.db.models import QueryLog, AuditLog
                db.add_all([
                    ChatHistory(id=str(uuid.uuid4()), session_id=session_id, role="user", content=req.query, user_id=current_user.id),
                    ChatHistory(id=str(uuid.uuid4()), session_id=session_id, role="assistant", content=result["answer"], user_id=current_user.id),
                    QueryLog(id=str(uuid.uuid4()), session_id=session_id, query=req.query, answer=result["answer"], response_time_ms=duration_ms),
                    AuditLog(id=str(uuid.uuid4()), user_id=current_user.id, action="query", details={"session_id": session_id}),
                ])
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
    current_user: User = Depends(get_current_user_required), 
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
