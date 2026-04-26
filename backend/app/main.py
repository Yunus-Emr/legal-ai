from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware

from app.core.config import settings
from app.core.logger import get_logger
from app.api.routes import chat, documents, search, health, auth, drafts, analytics, admin

logger = get_logger(__name__)

app = FastAPI(
    title="Legal AI API",
    description="RAG-destekli hukuki doküman soru-cevap sistemi",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── Middleware ──────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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

# ── Startup / Shutdown ──────────────────────────────────────────
@app.on_event("startup")
async def on_startup():
    logger.info("🚀 Legal AI API başlatılıyor...")
    logger.info(f"   Environment: {settings.ENV}")
    logger.info(f"   Debug:       {settings.DEBUG}")

@app.on_event("shutdown")
async def on_shutdown():
    logger.info("🛑 Legal AI API kapatılıyor...")

@app.get("/")
async def root():
    return {
        "name": "Legal AI API",
        "version": "1.0.0",
        "docs": "/docs",
    }
