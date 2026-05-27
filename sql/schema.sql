-- ═══════════════════════════════════════════════════════
-- Legal AI — PostgreSQL Schema
-- ═══════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── Users ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id          VARCHAR(36)  PRIMARY KEY DEFAULT gen_random_uuid()::text,
    email       VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255),
    name        VARCHAR(255) NOT NULL,
    is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- ── Documents ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS documents (
    id          VARCHAR(36)  PRIMARY KEY,
    filename    VARCHAR(500) NOT NULL,
    size_bytes  INTEGER,
    chunk_count INTEGER      DEFAULT 0,
    status      VARCHAR(20)  NOT NULL DEFAULT 'processing',
    user_id     VARCHAR(36)  REFERENCES users(id) ON DELETE SET NULL,
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_documents_status     ON documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at DESC);

-- ── Chat History ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS chat_history (
    id          VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    session_id  VARCHAR(36) NOT NULL,
    role        VARCHAR(20) NOT NULL,  -- user | assistant
    content     TEXT        NOT NULL,
    user_id     VARCHAR(36) REFERENCES users(id) ON DELETE SET NULL,
    created_at  TIMESTAMP   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_session  ON chat_history(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_created  ON chat_history(created_at DESC);

-- ── Query Logs ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS query_logs (
    id                VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    session_id        VARCHAR(36) NOT NULL,
    query             TEXT        NOT NULL,
    answer            TEXT,
    response_time_ms  INTEGER,
    created_at        TIMESTAMP   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_query_logs_session   ON query_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_query_logs_created   ON query_logs(created_at DESC);

-- ── Auth & Roles ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_roles (
    user_id     VARCHAR(36) REFERENCES users(id) ON DELETE CASCADE,
    role        VARCHAR(50) NOT NULL,
    PRIMARY KEY (user_id, role)
);

CREATE TABLE IF NOT EXISTS sessions (
    id          VARCHAR(255) PRIMARY KEY, -- Session token / JWT JTI
    user_id     VARCHAR(36)  REFERENCES users(id) ON DELETE CASCADE,
    expires_at  TIMESTAMP    NOT NULL,
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- ── Contract Studio (Drafts) ────────────────────────────
CREATE TABLE IF NOT EXISTS drafts (
    id          VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id     VARCHAR(36) REFERENCES users(id) ON DELETE CASCADE,
    title       VARCHAR(255) NOT NULL,
    content     TEXT,
    updated_at  TIMESTAMP   NOT NULL DEFAULT NOW(),
    created_at  TIMESTAMP   NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_drafts_user ON drafts(user_id);

-- ── Analytics & Audit Logs ──────────────────────────────
CREATE TABLE IF NOT EXISTS audit_logs (
    id          VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id     VARCHAR(36) REFERENCES users(id) ON DELETE SET NULL,
    action      VARCHAR(100) NOT NULL,
    details     JSONB,
    created_at  TIMESTAMP   NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);

-- ── Record Metadata (JSON Records) ──────────────────────
CREATE TABLE IF NOT EXISTS record_metadata (
    id VARCHAR(36) PRIMARY KEY,
    text TEXT,
    article VARCHAR(255),
    section VARCHAR(255),
    pages JSONB,
    window_index INTEGER,
    total_windows INTEGER,
    method VARCHAR(50),
    word_count INTEGER,
    char_count INTEGER,
    law_name VARCHAR(255),
    source_file VARCHAR(500),
    doc_type VARCHAR(100),
    kanun_no VARCHAR(100),
    resmi_gazete_tarihi VARCHAR(50),
    resmi_gazete_sayisi VARCHAR(50),
    kabul_tarihi VARCHAR(50),
    kurumlar JSONB,
    kisiler JSONB,
    toplam_sayfa INTEGER,
    extraction_date TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ── System Config ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS system_config (
    key VARCHAR(100) PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ── Matters (Cases) ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS matters (
    id          VARCHAR(50)  PRIMARY KEY,
    title       VARCHAR(255) NOT NULL,
    client      VARCHAR(255) NOT NULL,
    type        VARCHAR(100) NOT NULL,
    status      VARCHAR(50)  NOT NULL DEFAULT 'Pending',
    risk        VARCHAR(20)  NOT NULL DEFAULT 'Low',
    attorney    VARCHAR(255),
    due_date    VARCHAR(50),
    user_id     VARCHAR(36)  REFERENCES users(id) ON DELETE CASCADE,
    updated_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_matters_user   ON matters(user_id);
CREATE INDEX IF NOT EXISTS idx_matters_status ON matters(status);

-- ── PageIndex (Vectorless RAG) ──────────────────────────
CREATE TABLE IF NOT EXISTS document_toc (
    document_id VARCHAR(36) PRIMARY KEY REFERENCES documents(id) ON DELETE CASCADE,
    toc JSONB NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS document_nodes (
    document_id VARCHAR(36) REFERENCES documents(id) ON DELETE CASCADE,
    node_id VARCHAR(100) NOT NULL,
    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    metadata JSONB,
    PRIMARY KEY (document_id, node_id)
);

CREATE INDEX IF NOT EXISTS idx_document_nodes_doc ON document_nodes(document_id);
