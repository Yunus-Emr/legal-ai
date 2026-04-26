from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # App
    APP_NAME: str = "Legal AI"
    ENV: str = "development"
    DEBUG: bool = True
    SECRET_KEY: str = "changeme-use-strong-key-in-production"

    # API
    API_KEY: str = ""
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:5173"]

    # OpenAI / LLM
    OPENAI_API_KEY: str = ""
    LLM_PROVIDER: str = "openai" # huggingface | openai
    LLM_MODEL: str = "gpt-3.5-turbo"
    LLM_LOCAL_MODEL_PATH: str = "TinyLlama/TinyLlama-1.1B-Chat-v1.0"
    LLM_DEVICE: str = "cpu" # cuda | cpu | mps
    LLM_TEMPERATURE: float = 0.1
    LLM_MAX_TOKENS: int = 1024

    # Embeddings
    EMBEDDING_MODEL: str = "intfloat/e5-large"
    EMBEDDING_DIM: int = 1024

    # OpenSearch
    OPENSEARCH_HOST: str = "localhost"
    OPENSEARCH_PORT: int = 9200
    OPENSEARCH_INDEX: str = "legal_chunks"
    OPENSEARCH_USER: str = ""
    OPENSEARCH_PASS: str = ""

    # PostgreSQL
    POSTGRES_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/legalai"

    # RAG
    RAG_TOP_K: int = 5
    RAG_CHUNK_SIZE: int = 512
    RAG_CHUNK_OVERLAP: int = 64

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"


settings = Settings()
