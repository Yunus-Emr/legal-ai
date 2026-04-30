from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, text
from app.db.postgres import get_db
from app.core.security import get_current_user
from app.db.models import User, Document, ChatHistory, QueryLog, AuditLog

router = APIRouter()


@router.get("/dashboard")
async def get_dashboard(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    docs = await db.scalar(select(func.count()).select_from(Document)) or 0
    chunks = await db.scalar(select(func.sum(Document.chunk_count)).select_from(Document)) or 0
    queries = await db.scalar(select(func.count()).select_from(QueryLog)) or 0
    avg_time = await db.scalar(select(func.avg(QueryLog.response_time_ms))) or 0

    return {
        "total_documents": docs,
        "total_chunks": int(chunks),
        "total_queries": queries,
        "avg_response_time_ms": round(float(avg_time), 2),
        "current_user_name": current_user.name,
    }


@router.get("/activity")
async def get_activity(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(AuditLog).order_by(AuditLog.created_at.desc()).limit(10)
    )
    return [
        {
            "type": a.action,
            "description": (a.details.get("filename") or a.action) if a.details else a.action,
            "timestamp": a.created_at.isoformat(),
        }
        for a in result.scalars().all()
    ]


@router.get("/query-trends")
async def get_query_trends(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Son 7 günün günlük sorgu sayısını döner."""
    result = await db.execute(text("""
        SELECT
            DATE(created_at) as date,
            COUNT(*) as queries
        FROM query_logs
        WHERE created_at >= NOW() - INTERVAL '7 days'
        GROUP BY DATE(created_at)
        ORDER BY date ASC
    """))
    rows = result.fetchall()
    return [{"date": str(r[0]), "queries": r[1]} for r in rows]


@router.get("/top-documents")
async def get_top_documents(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """En çok sorgulanan dokümanları döner (query_logs'dan join ile)."""
    result = await db.execute(text("""
        SELECT
            d.filename,
            COUNT(ql.id) as query_count
        FROM documents d
        LEFT JOIN query_logs ql ON ql.session_id IN (
            SELECT DISTINCT session_id FROM chat_history WHERE user_id = :uid
        )
        GROUP BY d.filename
        ORDER BY query_count DESC
        LIMIT 10
    """), {"uid": current_user.id})
    rows = result.fetchall()
    return [{"name": r[0], "queries": r[1]} for r in rows]


@router.get("/response-time")
async def get_response_time_distribution(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Yanıt süresi dağılımını döner (0-1s, 1-2s, ... aralıkları)."""
    result = await db.execute(text("""
        SELECT
            CASE
                WHEN response_time_ms < 1000 THEN '0-1s'
                WHEN response_time_ms < 2000 THEN '1-2s'
                WHEN response_time_ms < 3000 THEN '2-3s'
                WHEN response_time_ms < 4000 THEN '3-4s'
                WHEN response_time_ms < 5000 THEN '4-5s'
                ELSE '5s+'
            END as range,
            COUNT(*) as count
        FROM query_logs
        GROUP BY range
        ORDER BY MIN(response_time_ms)
    """))
    rows = result.fetchall()
    return [{"range": r[0], "count": r[1]} for r in rows]


@router.get("/heatmap")
async def get_usage_heatmap(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Saat × gün kullanım matrisi (0=Pzt, 6=Paz, saat 0-23)."""
    result = await db.execute(text("""
        SELECT
            EXTRACT(DOW FROM created_at)::int as day_of_week,
            EXTRACT(HOUR FROM created_at)::int as hour,
            COUNT(*) as count
        FROM query_logs
        WHERE created_at >= NOW() - INTERVAL '30 days'
        GROUP BY day_of_week, hour
    """))
    rows = result.fetchall()
    return [{"day": r[0], "hour": r[1], "value": r[2]} for r in rows]

