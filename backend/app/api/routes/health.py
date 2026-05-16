from fastapi import APIRouter, Depends
from app.core.security import get_api_key
from app.core.logger import get_logger
import time

router = APIRouter()
logger = get_logger(__name__)

START_TIME = time.time()


@router.get("/health")
async def health_check():
    """
    Sistem sağlık durumunu döner.
    Auth gerektirmez — load balancer ve monitoring sistemleri için erişilebilir.
    Hassas bilgi içermediğinden public bırakılmıştır.
    """
    from app.db.postgres import SessionLocal
    from app.vectorstore.opensearch_client import opensearch_client

    postgres_ok = False
    try:
        async with SessionLocal() as db:
            from sqlalchemy import text
            await db.execute(text("SELECT 1"))
            postgres_ok = True
    except Exception as e:
        logger.warning(f"[Health] Postgres kontrol hatası: {e}")

    opensearch_ok = await opensearch_client.ping()

    uptime = int(time.time() - START_TIME)
    status = "ok" if postgres_ok and opensearch_ok else "degraded"

    if status == "degraded":
        logger.warning(f"[Health] Sistem degraded — postgres={postgres_ok} opensearch={opensearch_ok}")

    return {
        "status": status,
        "version": "1.0.0",
        "uptime_seconds": uptime,
        "opensearch": opensearch_ok,
        "postgres": postgres_ok,
    }
