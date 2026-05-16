from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from app.core.rate_limit import limiter  # Circular import önlendi — ayrı modülde

from app.core.config import settings
from app.core.logger import get_logger
from app.api.routes import chat, documents, search, health, auth, drafts, analytics, admin, ws

logger = get_logger(__name__)

from contextlib import asynccontextmanager
import asyncio

# Rate limiter import edildi (satır 6)

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("🚀 Legal AI API başlatılıyor...")
    logger.info(f"   Environment: {settings.ENV}")
    logger.info(f"   Debug:       {settings.DEBUG}")

    # SECRET_KEY güvenlik kontrolü
    weak_keys = {"changeme", "change-this", "secret", "change-this-to-a-long-random-secret"}
    if any(settings.SECRET_KEY.lower().startswith(w) for w in weak_keys):
        logger.warning("⚠️  SECRET_KEY varsayılan değer! .env dosyasını güncelleyin: python -c \"import secrets; print(secrets.token_hex(64))\"")

    # Embedding modelini önceden yükle (ilk istek soğuğu önler)
    try:
        from app.services.embedding_service import embedding_service
        logger.info("[Startup] Embedding modeli yükleniyor...")
        await asyncio.to_thread(embedding_service._load_model)
        logger.info("[Startup] Embedding modeli hazır")
    except Exception as exc:
        logger.warning(f"[Startup] Embedding model preload atlandı: {exc}")

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
