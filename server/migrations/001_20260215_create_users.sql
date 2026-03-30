-- Migration: 001_20260215_create_users
-- Creates the users table linked to Firebase Authentication.

CREATE TABLE IF NOT EXISTS users (
    firebase_uid    VARCHAR(128) PRIMARY KEY,
    deleted_at      TIMESTAMP,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_created_at ON users (created_at);

DROP TRIGGER IF EXISTS trigger_update_updated_at ON users;
CREATE TRIGGER trigger_update_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();
