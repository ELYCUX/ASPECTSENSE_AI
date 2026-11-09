-- Migration 003: RBAC, User Ownership, and Admin Auditing

-- 1. Extend users table for RBAC and account status
ALTER TABLE users ADD COLUMN IF NOT EXISTS account_status VARCHAR(20) DEFAULT 'active';
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(account_status);

-- 2. User data ownership on products and reviews
-- is_shared = true ensures existing legacy demo products/reviews remain visible to all users
ALTER TABLE products ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_shared BOOLEAN DEFAULT TRUE;

CREATE INDEX IF NOT EXISTS idx_products_user_id ON products(user_id);

ALTER TABLE reviews ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS is_shared BOOLEAN DEFAULT TRUE;

CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);

-- 3. Admin Activity Logs table for enterprise audit trail
CREATE TABLE IF NOT EXISTS admin_activity_logs (
    id SERIAL PRIMARY KEY,
    admin_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    admin_email VARCHAR(255),
    action VARCHAR(100) NOT NULL,
    target_type VARCHAR(50),
    target_id INTEGER,
    description TEXT,
    ip_address VARCHAR(50),
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_admin_id ON admin_activity_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_activity_action ON admin_activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_activity_created_at ON admin_activity_logs(created_at DESC);

-- 4. System Settings table
CREATE TABLE IF NOT EXISTS system_settings (
    id SERIAL PRIMARY KEY,
    key VARCHAR(100) UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default system settings if not already present
INSERT INTO system_settings (key, value, description)
VALUES 
    ('app_info', '{"name": "AspectSense AI", "version": "2.0.0", "maintenance_mode": false}'::jsonb, 'General application information and maintenance status'),
    ('review_limits', '{"max_upload_size_mb": 10, "max_reviews_per_import": 500, "rate_limit_per_minute": 60}'::jsonb, 'Upload and rate limiting configuration'),
    ('ai_settings', '{"default_model": "roberta-base-absa-ate-sentiment", "batch_size": 32, "summarizer_provider": "extractive", "confidence_threshold": 0.5}'::jsonb, 'AI and NLP pipeline execution parameters'),
    ('supported_marketplaces', '["amazon.in", "amazon.com", "amazon.co.uk", "amazon.de", "amazon.ca", "amazon.co.jp"]'::jsonb, 'List of allowed Amazon marketplace domains')
ON CONFLICT (key) DO NOTHING;

-- 5. User Notifications table
CREATE TABLE IF NOT EXISTS user_notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info',
    is_read BOOLEAN DEFAULT FALSE,
    link VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON user_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON user_notifications(is_read);
