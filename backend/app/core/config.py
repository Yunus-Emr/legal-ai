from pydantic_settings import BaseSettings
from typing import List, Union
import json


def parse_list(v: Union[str, List[str]]) -> List[str]:
    """Hem JSON string hem de liste olarak gelen CORS_ORIGINS'i parse eder."""
    if isinstance(v, list):
        return v
    try:
        parsed = json.loads(v)
        if isinstance(parsed, list):
            return parsed
    except (json.JSONDecodeError, TypeError):
        pass
    # Virgülle ayrılmış string
    return [x.strip() for x in v.split(",") if x.strip()]


class Settings(BaseSettings):
    # App
    APP_NAME: str = "Legal AI"
    ENV: str = "development"
    DEBUG: bool = True
    SECRET_KEY: str = "changeme-use-strong-key-in-production"

    # API
    API_KEY: str = ""
    CORS_ORIGINS: Union[List[str], str] = [
        "http://localhost:3000",
        "http://localhost:5173",
    ]

    # OpenAI / LLM
    OPENAI_API_KEY: str = ""
    LLM_PROVIDER: str = "openai"  # openai
    LLM_MODEL: str = "gpt-4o"
    LLM_TEMPERATURE: float = 0.1
    LLM_MAX_TOKENS: int = 1024

    # Embeddings
    EMBEDDING_MODEL: str = "intfloat/multilingual-e5-large"
    EMBEDDING_DIM: int = 1024
    EMBEDDING_BATCH_SIZE: int = 32  # CPU: 16-32, GPU: 64-128

    # OpenSearch
    OPENSEARCH_HOST: str = "localhost"
    OPENSEARCH_PORT: int = 9200
    OPENSEARCH_INDEX: str = "legal_chunks"
    OPENSEARCH_USER: str = ""
    OPENSEARCH_PASS: str = ""
    OPENSEARCH_USE_SSL: bool = False
    OPENSEARCH_VERIFY_CERTS: bool = False

    # PostgreSQL
    POSTGRES_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/legalai"

    # RAG
    RAG_TOP_K: int = 5
    RAG_CHUNK_SIZE: int = 512
    RAG_CHUNK_OVERLAP: int = 64
    RAG_HISTORY_WINDOW: int = 6  # Konusma gecmisi penceresi (mesaj sayisi)

    # SMTP (şifre sıfırlama emaili)
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASS: str = ""
    SMTP_FROM: str = "noreply@legalai.com"
    FRONTEND_URL: str = "http://localhost:3000"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"

    def model_post_init(self, __context) -> None:
        if isinstance(self.CORS_ORIGINS, str):
            object.__setattr__(self, "CORS_ORIGINS", parse_list(self.CORS_ORIGINS))


settings = Settings()
