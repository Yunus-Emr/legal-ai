"""
RAG Servis Unit Testleri — Mock ile izole test
"""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch


class TestChunking:
    """Chunking mantığını test eder."""

    def test_chunk_by_paragraph_basic(self):
        from app.rag.chunking import chunk_by_paragraph
        text = "Madde 1. Kıdem tazminatı.\n\nMadde 2. İhbar tazminatı."
        chunks = chunk_by_paragraph(text, doc_id="doc1", filename="test.pdf")
        assert len(chunks) >= 1
        assert all("text" in c for c in chunks)
        assert all("doc_id" in c for c in chunks)

    def test_chunk_preserves_content(self):
        from app.rag.chunking import chunk_by_paragraph
        text = "İşçinin kıdem tazminatı hakkı doğar.\n\nBu hak en az 1 yıl çalışmayı gerektirir."
        chunks = chunk_by_paragraph(text, doc_id="doc1", filename="test.pdf")
        full_text = " ".join(c["text"] for c in chunks)
        assert "kıdem tazminatı" in full_text

    def test_empty_text_returns_empty(self):
        from app.rag.chunking import chunk_by_paragraph
        chunks = chunk_by_paragraph("", doc_id="doc1", filename="test.pdf")
        assert chunks == []


class TestPipelineContext:
    """Pipeline context oluşturmayı test eder."""

    def test_build_context_basic(self):
        from app.rag.pipeline import build_context
        hits = [
            {"text": "İşçi kıdem tazminatı alır.", "document_name": "4857.pdf", "score": 0.9},
            {"text": "En az 1 yıl gerekir.", "document_name": "4857.pdf", "score": 0.8},
        ]
        ctx = build_context(hits, max_tokens=500)
        assert "kıdem tazminatı" in ctx
        assert "4857.pdf" in ctx

    def test_build_context_respects_max_tokens(self):
        from app.rag.pipeline import build_context
        hits = [{"text": " ".join(["kelime"] * 200), "document_name": "doc.pdf", "score": 0.5}]
        ctx = build_context(hits, max_tokens=50)
        word_count = len(ctx.split())
        assert word_count <= 100  # Başlık + kelimeler

    def test_build_context_empty_hits(self):
        from app.rag.pipeline import build_context
        ctx = build_context([], max_tokens=500)
        assert ctx == ""



class TestPasswordHashing:
    """Şifre hash fonksiyonlarını test eder."""

    def test_hash_and_verify(self):
        from app.services.auth_service import get_password_hash, verify_password
        raw = "güçlüşifre123"
        hashed = get_password_hash(raw)
        assert hashed != raw
        assert verify_password(raw, hashed)

    def test_wrong_password_fails(self):
        from app.services.auth_service import get_password_hash, verify_password
        hashed = get_password_hash("doğrushifre123")
        assert not verify_password("yanlishshifre123", hashed)

    def test_empty_hash_fails(self):
        from app.services.auth_service import verify_password
        assert not verify_password("sifre", "")


class TestTokenCreation:
    """JWT token oluşturmayı test eder."""

    def test_access_token_decode(self):
        from app.services.auth_service import create_access_token, SECRET_KEY, ALGORITHM
        from jose import jwt
        token = create_access_token({"sub": "user-123"})
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        assert payload["sub"] == "user-123"
        assert payload.get("type") == "access"

    def test_refresh_token_type(self):
        from app.services.auth_service import create_refresh_token, SECRET_KEY, ALGORITHM
        from jose import jwt
        token = create_refresh_token({"sub": "user-123"})
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        assert payload.get("type") == "refresh"

    def test_reset_token_hash_consistency(self):
        from app.services.auth_service import generate_reset_token, hash_reset_token
        raw, hashed = generate_reset_token()
        assert hash_reset_token(raw) == hashed
