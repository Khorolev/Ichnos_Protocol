-- Migration: 002_20260215_create_user_profiles
-- Creates the user_profiles table with personal and company details.

CREATE TABLE IF NOT EXISTS user_profiles (
    user_id     VARCHAR(128) PRIMARY KEY,
    name        VARCHAR(255) NOT NULL,
    surname     VARCHAR(255) NOT NULL,
    email       VARCHAR(255) NOT NULL,
    phone       VARCHAR(50),
    company     VARCHAR(255),
    linkedin    VARCHAR(500),
    created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_user_profiles_user
        FOREIGN KEY (user_id) REFERENCES users (firebase_uid) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles (email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_company ON user_profiles (company);

DROP TRIGGER IF EXISTS trigger_update_updated_at ON user_profiles;
CREATE TRIGGER trigger_update_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();
