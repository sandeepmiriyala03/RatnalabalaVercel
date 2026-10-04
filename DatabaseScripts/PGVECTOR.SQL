-- =========================================================
-- RATNALABALA - GNANAMALA VECTOR SEARCH DATABASE
-- =========================================================

-- 1. Extensions
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;


-- 2. Main Gnanamala table
CREATE TABLE IF NOT EXISTS gnanamala (
    id              BIGSERIAL PRIMARY KEY,

    source_key      VARCHAR(120) NOT NULL UNIQUE,

    mala            VARCHAR(100) NOT NULL,

    mala_group      VARCHAR(50) NOT NULL,

    title           TEXT NOT NULL,

    content         TEXT,

    source          TEXT,

    details         TEXT,

    link            VARCHAR(500),

    content_hash    CHAR(64) NOT NULL,

    embedding       VECTOR(1024),

    embedding_model VARCHAR(100),

    search_tsv      TSVECTOR GENERATED ALWAYS AS (
        to_tsvector(
            'simple',
            coalesce(title, '') || ' ' ||
            coalesce(content, '') || ' ' ||
            coalesce(details, '')
        )
    ) STORED,

    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- =========================================================
-- 3. HNSW VECTOR INDEX
-- =========================================================

CREATE INDEX IF NOT EXISTS ix_gnanamala_embedding
ON gnanamala
USING hnsw (embedding vector_cosine_ops);


-- =========================================================
-- 4. FULL-TEXT SEARCH INDEX
-- =========================================================

CREATE INDEX IF NOT EXISTS ix_gnanamala_tsv
ON gnanamala
USING gin (search_tsv);


-- =========================================================
-- 5. TYPO-TOLERANT TITLE SEARCH
-- =========================================================

CREATE INDEX IF NOT EXISTS ix_gnanamala_title_trgm
ON gnanamala
USING gin (title gin_trgm_ops);


-- =========================================================
-- 6. MALA FILTER
-- =========================================================

CREATE INDEX IF NOT EXISTS ix_gnanamala_mala
ON gnanamala (mala);


-- =========================================================
-- 7. MALA GROUP FILTER
-- =========================================================

CREATE INDEX IF NOT EXISTS ix_gnanamala_mala_group
ON gnanamala (mala_group);


-- =========================================================
-- DONE
-- =========================================================