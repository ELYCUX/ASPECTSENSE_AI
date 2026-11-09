-- Migration 001: Add AI columns to reviews table and create indexes
-- Run this against your Supabase PostgreSQL database

-- Add new columns to reviews table (safe - uses IF NOT EXISTS)
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'manual';
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS external_review_id VARCHAR(255);
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS analysis_method VARCHAR(50) DEFAULT 'rule_based';
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS model_name VARCHAR(100);
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS confidence_score FLOAT;

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_sentiment ON reviews(sentiment);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_source ON reviews(source);
CREATE INDEX IF NOT EXISTS idx_reviews_ext_id ON reviews(external_review_id) WHERE external_review_id IS NOT NULL;
