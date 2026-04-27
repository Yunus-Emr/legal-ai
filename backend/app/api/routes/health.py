from fastapi import APIRouter, Depends
from app.core.security import get_api_key
import time

router = APIRouter()

START_TIME = time.time()


@router.get("/health")
async def health_check():
    from app.db.postgres import SessionLocal
    from app.vectorstore.opensearch_client import opensearch_client
    
    postgres_ok = False
    try:
        async with SessionLocal() as db:
            from sqlalchemy import text
            await db.execute(text("SELECT 1"))
            postgres_ok = True
    except Exception as e:
        print(f"Postgres health check error: {e}")
        pass

    opensearch_ok = await opensearch_client.ping()
    
    uptime = int(time.time() - START_TIME)
    return {
        "status": "ok" if postgres_ok and opensearch_ok else "degraded",
        "version": "1.0.0",
        "uptime_seconds": uptime,
        "opensearch": opensearch_ok,
        "postgres": postgres_ok,
    }
