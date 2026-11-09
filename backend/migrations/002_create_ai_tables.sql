-- Migration 002: Create AI-specific tables

-- Amazon import tracking
CREATE TABLE IF NOT EXISTS amazon_imports (
    id SERIAL PRIMARY KEY,
    asin VARCHAR(50) NOT NULL,
    marketplace VARCHAR(50),
    product_id INTEGER REFERENCES products(id),
    product_title TEXT,
    product_image_url TEXT,
    product_rating FLOAT,
    review_count INTEGER,
    imported_count INTEGER DEFAULT 0,
    duplicate_count INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'pending',
    user_id INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_amazon_imports_asin ON amazon_imports(asin);

-- AI-generated summaries (one per product, upserted)
CREATE TABLE IF NOT EXISTS ai_summaries (
    id SERIAL PRIMARY KEY,
    product_id INTEGER UNIQUE REFERENCES products(id),
    summary_text TEXT,
    positive_highlights JSONB,
    negative_highlights JSONB,
    recommendations JSONB,
    model_used VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ai_summaries_product ON ai_summaries(product_id);

-- Background job tracking (Celery-independent)
CREATE TABLE IF NOT EXISTS analysis_jobs (
    id SERIAL PRIMARY KEY,
    job_type VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'queued',
    product_id INTEGER,
    metadata JSONB,
    result JSONB,
    error_message TEXT,
    progress INTEGER DEFAULT 0,
    total INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON analysis_jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_product ON analysis_jobs(product_id);
