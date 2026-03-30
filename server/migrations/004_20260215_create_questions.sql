-- Migration: 004_20260215_create_questions
-- Creates the questions table for chat and form inquiries.

CREATE TABLE IF NOT EXISTS questions (
    id                  SERIAL PRIMARY KEY,
    user_id             VARCHAR(128) NOT NULL,
    contact_request_id  INTEGER,
    question            TEXT NOT NULL,
    answer              TEXT,
    source              VARCHAR(50) NOT NULL,
    created_at          TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_questions_user
        FOREIGN KEY (user_id) REFERENCES users (firebase_uid) ON DELETE RESTRICT,

    CONSTRAINT fk_questions_contact_request
        FOREIGN KEY (contact_request_id) REFERENCES contact_requests (id) ON DELETE CASCADE,

    CONSTRAINT chk_questions_source
        CHECK (source IN ('form', 'chat'))
);

CREATE INDEX IF NOT EXISTS idx_questions_user_id ON questions (user_id);
CREATE INDEX IF NOT EXISTS idx_questions_contact_request_id ON questions (contact_request_id);
CREATE INDEX IF NOT EXISTS idx_questions_created_at ON questions (created_at);
CREATE INDEX IF NOT EXISTS idx_questions_source ON questions (source);
CREATE INDEX IF NOT EXISTS idx_questions_user_source_created_at ON questions (user_id, source, created_at);

DROP TRIGGER IF EXISTS trigger_update_updated_at ON questions;
CREATE TRIGGER trigger_update_updated_at
    BEFORE UPDATE ON questions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();
