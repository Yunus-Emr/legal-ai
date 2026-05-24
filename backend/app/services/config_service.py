"""
Config Service — Dynamic configuration loader from database SystemConfig
"""
from typing import Any, Dict
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.models import SystemConfig
from app.core.config import settings

class DynamicConfigService:
    async def get_value(self, db: AsyncSession, key: str, default: Any = None) -> Any:
        """Retrieves a config value from SystemConfig table. Fallbacks to default if not set."""
        try:
            result = await db.execute(select(SystemConfig).where(SystemConfig.key == key))
            config = result.scalar_one_or_none()
            if config is not None:
                return config.value
        except Exception:
            pass
        return default

    async def get_all(self, db: AsyncSession) -> Dict[str, Any]:
        """Retrieves all dynamic config values merged with environmental fallbacks."""
        try:
            result = await db.execute(select(SystemConfig))
            configs = result.scalars().all()
            db_map = {c.key: c.value for c in configs}
        except Exception:
            db_map = {}

        return {
            "llm_model": db_map.get("llm_model", settings.LLM_MODEL),
            "llm_provider": db_map.get("llm_provider", settings.LLM_PROVIDER),
            "temperature": float(db_map.get("temperature", settings.LLM_TEMPERATURE)),
            "max_tokens": int(db_map.get("max_tokens", settings.LLM_MAX_TOKENS)),
            "chunk_size": int(db_map.get("chunk_size", settings.RAG_CHUNK_SIZE)),
            "chunk_overlap": int(db_map.get("chunk_overlap", settings.RAG_CHUNK_OVERLAP)),
            "top_k": int(db_map.get("top_k", settings.RAG_TOP_K)),
            "embedding_model": db_map.get("embedding_model", settings.EMBEDDING_MODEL),
        }

config_service = DynamicConfigService()
