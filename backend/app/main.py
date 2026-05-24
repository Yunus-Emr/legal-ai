from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from app.core.rate_limit import limiter  # Circular import önlendi — ayrı modülde

from app.core.config import settings
from app.core.logger import get_logger
from app.api.routes import chat, documents, search, health, auth, drafts, analytics, admin, ws, matters

logger = get_logger(__name__)

from contextlib import asynccontextmanager
import asyncio

# Rate limiter import edildi (satır 6)

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("🚀 Legal AI API başlatılıyor...")
    logger.info(f"   Environment: {settings.ENV}")
    logger.info(f"   Debug:       {settings.DEBUG}")

    # Eksik veritabanı tablolarını (Matters vb.) otomatik oluştur
    try:
        from app.db.postgres import engine
        from app.db.models import Base
        logger.info("[Startup] Veritabanı tabloları kontrol ediliyor...")
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("[Startup] Tüm veritabanı tabloları kontrol edildi / hazır.")
    except Exception as exc:
        logger.error(f"[Startup] Veritabanı tabloları otomatik oluşturulurken hata: {exc}", exc_info=True)

    # SECRET_KEY güvenlik kontrolü
    weak_keys = {"changeme", "change-this", "secret", "change-this-to-a-long-random-secret"}
    if any(settings.SECRET_KEY.lower().startswith(w) for w in weak_keys):
        logger.warning("⚠️  SECRET_KEY varsayılan değer! .env dosyasını güncelleyin: python -c \"import secrets; print(secrets.token_hex(64))\"")

    # OpenAI bağlantı testi (embedding + reranker artık OpenAI API üzerinden)
    try:
        from app.services.embedding_service import embedding_service
        test_vec = await embedding_service.embed_text("bağlantı testi")
        logger.info(f"[Startup] OpenAI Embedding OK — dim={len(test_vec)}")
    except Exception as exc:
        logger.warning(f"[Startup] OpenAI Embedding testi başarısız: {exc}")

    # OpenSearch index
    try:
        from app.services.retrieval_service import retrieval_service
        await retrieval_service.ensure_index()
    except Exception as exc:
        logger.warning(f"OpenSearch index ensure atlandı: {exc}")

    yield
    logger.info("🛑 Legal AI API kapatılıyor...")

app = FastAPI(
    title="Legal AI API",
    description="RAG-destekli hukuki doküman soru-cevap sistemi",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# ── Rate Limiting ───────────────────────────────────────────────
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ── Middleware ──────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# TrustedHost — SSRF koruması (yalnızca production'da aktif)
if settings.ENV != "development":
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=["localhost", "127.0.0.1", "*.legalai.com"],
    )

# ── Routers ─────────────────────────────────────────────────────
app.include_router(health.router, prefix="/api/v1", tags=["Health"])
app.include_router(chat.router, prefix="/api/v1", tags=["Chat"])
app.include_router(documents.router, prefix="/api/v1", tags=["Documents"])
app.include_router(search.router, prefix="/api/v1", tags=["Search"])
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Auth"])
app.include_router(drafts.router, prefix="/api/v1/drafts", tags=["Drafts"])
app.include_router(matters.router, prefix="/api/v1/matters", tags=["Matters"])
app.include_router(analytics.router, prefix="/api/v1/analytics", tags=["Analytics"])
app.include_router(admin.router, prefix="/api/v1/admin", tags=["Admin"])
app.include_router(ws.router, tags=["WebSocket"])


@app.get("/")
async def root():
    return {
        "name": "Legal AI API",
        "version": "1.0.0",
        "docs": "/docs",
    }
