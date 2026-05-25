"""
DB Models — SQLAlchemy ORM modelleri
"""
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, Text, ForeignKey, Float, JSON, Boolean
from sqlalchemy.orm import DeclarativeBase

class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True)
    email = Column(String, unique=True, nullable=False)
    hashed_password = Column(String, nullable=True)
    name = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)


class Document(Base):
    __tablename__ = "documents"
    id = Column(String, primary_key=True)
    filename = Column(String, nullable=False)
    size_bytes = Column(Integer)
    chunk_count = Column(Integer, default=0)
    status = Column(String, default="processing")  # processing, indexed, error
    created_at = Column(DateTime, default=datetime.utcnow)
    user_id = Column(String, ForeignKey("users.id"), nullable=True)


class ChatHistory(Base):
    __tablename__ = "chat_history"
    id = Column(String, primary_key=True)
    session_id = Column(String, nullable=False, index=True)
    role = Column(String, nullable=False)  # user | assistant
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    user_id = Column(String, ForeignKey("users.id"), nullable=True)


class QueryLog(Base):
    __tablename__ = "query_logs"
    id = Column(String, primary_key=True)
    session_id = Column(String, nullable=False, index=True)
    query = Column(Text, nullable=False)
    answer = Column(Text)
    response_time_ms = Column(Integer)
    # Hangi dokümanlar kaynak gösterildi — analytics/top-documents için
    sources = Column(JSON, nullable=True)  # [{document_name, chunk_id, score}]
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

class UserRole(Base):
    __tablename__ = "user_roles"
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    role = Column(String, primary_key=True)

class Session(Base):
    """JWT kimlik doğrulama stateless olduğundan bu tablo kullanılmıyor.
    Token blacklist gerekirse gelecekte aktif edilebilir.
    """
    __tablename__ = "sessions"
    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class Draft(Base):
    __tablename__ = "drafts"
    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String, nullable=False)
    content = Column(Text, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)

class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    action = Column(String, nullable=False, index=True)
    details = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

class RecordMetadata(Base):
    __tablename__ = "record_metadata"
    id = Column(String, primary_key=True)
    text = Column(Text)
    article = Column(String(255))
    section = Column(String(255))
    pages = Column(JSON)
    window_index = Column(Integer)
    total_windows = Column(Integer)
    method = Column(String(50))
    word_count = Column(Integer)
    char_count = Column(Integer)
    law_name = Column(String(255))
    source_file = Column(String(500))
    doc_type = Column(String(100))
    kanun_no = Column(String(100))
    resmi_gazete_tarihi = Column(String(50))
    resmi_gazete_sayisi = Column(String(50))
    kabul_tarihi = Column(String(50))
    kurumlar = Column(JSON)
    kisiler = Column(JSON)
    toplam_sayfa = Column(Integer)
    extraction_date = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)

class SystemConfig(Base):
    __tablename__ = "system_config"
    key = Column(String, primary_key=True)
    value = Column(JSON, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class PasswordResetToken(Base):
    """Güvenli şifre sıfırlama tokenları (hash'lenmiş, tek kullanımlık, 15 dk geçerli)."""
    __tablename__ = "password_reset_tokens"
    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    token_hash = Column(String, nullable=False, unique=True)  # sha256 hash
    expires_at = Column(DateTime, nullable=False)
    used = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class Matter(Base):
    __tablename__ = "matters"
    id = Column(String, primary_key=True)
    title = Column(String, nullable=False)
    client = Column(String, nullable=False)
    type = Column(String, nullable=False)
    status = Column(String, default="Pending")  # Active, Discovery, Review, Pending, Closed
    risk = Column(String, default="Low")  # High, Medium, Low
    attorney = Column(String, nullable=True)
    due_date = Column(String, nullable=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)


class MatterInsight(Base):
    __tablename__ = "matter_insights"
    id = Column(String, primary_key=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    confidence = Column(Integer, default=95)
    matter_name = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


