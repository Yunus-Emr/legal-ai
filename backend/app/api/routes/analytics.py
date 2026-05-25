from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, text
from app.db.postgres import get_db
from app.core.security import get_current_user
from app.db.models import User, Document, ChatHistory, QueryLog, AuditLog, MatterInsight

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
    """En çok kaynak gösterilen dokümanları query_logs.sources'dan çeker."""
    result = await db.execute(text("""
        SELECT
            src->>'document_name' as document_name,
            COUNT(*) as citation_count,
            AVG((src->>'score')::float) as avg_score
        FROM query_logs,
             jsonb_array_elements(sources::jsonb) as src
        WHERE sources IS NOT NULL
          AND created_at >= NOW() - INTERVAL '30 days'
        GROUP BY src->>'document_name'
        ORDER BY citation_count DESC
        LIMIT 10
    """))
    rows = result.fetchall()
    return [{"name": r[0], "citations": r[1], "avg_score": round(float(r[2] or 0), 3)} for r in rows]


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


@router.post("/reset")
async def reset_analytics(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Sorgu loglarını temizleyerek analiz metriklerini ve ortalama yanıt süresini sıfırlar."""
    await db.execute(text("DELETE FROM query_logs"))
    await db.commit()
    return {"status": "success", "message": "Analiz metrikleri sıfırlandı."}


@router.get("/insights")
async def get_insights(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Kritik Hukuki Analizleri (Matter Insights) SQL veritabanından çeker."""
    result = await db.execute(select(MatterInsight).order_by(MatterInsight.created_at.desc()))
    insights = result.scalars().all()
    
    # Eğer veritabanı boşsa varsayılan verilerle doldur (seeding)
    if not insights:
        defaults = [
            MatterInsight(
                id="ins-1",
                title="Sorumluluk Sınırlandırması maddesinde tutarsızlık tespit edildi",
                description="Son yüklenen Tedarikçi Sözleşmesi ana sözleşme standart maddesiyle (Bölüm 4.2) çelişen bir sorumluluk üst sınırı içeriyor.",
                confidence=95,
                matter_name="Küresel Lojistik"
            ),
            MatterInsight(
                id="ins-2",
                title="Rekabet yasağı süresi yasal sınırı aşıyor",
                description="Yeni iş sözleşmesinde öngörülen 3 yıllık rekabet yasağı süresi, Türk Borçlar Kanunu madde 444 uyarınca belirlenen azami 2 yıllık sınırı aşmaktadır.",
                confidence=98,
                matter_name="İş Hukuku Uyum"
            ),
            MatterInsight(
                id="ins-3",
                title="Cezai şart maddesinde orantısız bedel",
                description="Hizmet alım sözleşmesinin 8.1. maddesinde yüklenici aleyhine belirlenen cezai şart miktarı, edimler dengesine aykırı ve fahiş bulunmuştur.",
                confidence=91,
                matter_name="Kurumsal Tedarik"
            )
        ]
        for item in defaults:
            db.add(item)
        await db.commit()
        
        result = await db.execute(select(MatterInsight).order_by(MatterInsight.created_at.desc()))
        insights = result.scalars().all()

    return [
        {
            "id": ins.id,
            "title": ins.title,
            "description": ins.description,
            "confidence": ins.confidence,
            "matter_name": ins.matter_name,
            "created_at": ins.created_at.isoformat(),
        }
        for ins in insights
    ]



