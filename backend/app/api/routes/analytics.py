from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.db.postgres import get_db
from app.core.security import get_current_user
from app.db.models import User, Document, ChatHistory

router = APIRouter()

@router.get("/dashboard")
async def get_dashboard(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    from app.db.models import QueryLog
    
    docs = await db.scalar(select(func.count()).select_from(Document)) or 0
    chunks = await db.scalar(select(func.sum(Document.chunk_count)).select_from(Document)) or 0
    chats = await db.scalar(select(func.count()).select_from(ChatHistory)) or 0
    queries = await db.scalar(select(func.count()).select_from(QueryLog)) or 0
    avg_time = await db.scalar(select(func.avg(QueryLog.response_time_ms))) or 0
    
    return {
        "total_documents": docs,
        "total_chunks": int(chunks),
        "total_queries": queries,
        "avg_response_time_ms": round(float(avg_time), 2),
        "current_user_name": current_user.name
    }

@router.get("/activity")
async def get_activity(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    from app.db.models import AuditLog
    result = await db.execute(
        select(AuditLog)
        .order_by(AuditLog.created_at.desc())
        .limit(10)
    )
    activities = []
    for a in result.scalars().all():
        activities.append({
            "type": a.action,
            "description": a.details.get("filename") or a.action if a.details else a.action,
            "timestamp": a.created_at.isoformat()
        })
    return activities
