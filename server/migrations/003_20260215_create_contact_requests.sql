-- Migration: 003_20260215_create_contact_requests
-- Creates the contact_requests table for customer inquiry tracking.

CREATE TABLE IF NOT EXISTS contact_requests (
    id                          SERIAL PRIMARY KEY,
    user_id                     VARCHAR(128) NOT NULL,
    contact_consent_timestamp   TIMESTAMP NOT NULL,
    contact_consent_version     VARCHAR(20) NOT NULL DEFAULT 'v1',
    status                      VARCHAR(50) NOT NULL DEFAULT 'new',
    admin_notes                 TEXT,
    created_at                  TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_contact_requests_user
        FOREIGN KEY (user_id) REFERENCES users (firebase_uid) ON DELETE RESTRICT,

    CONSTRAINT chk_contact_requests_status
        CHECK (status IN ('new', 'contacted', 'in_progress', 'resolved'))
);

CREATE INDEX IF NOT EXISTS idx_contact_requests_user_id ON contact_requests (user_id);
CREATE INDEX IF NOT EXISTS idx_contact_requests_status ON contact_requests (status);
CREATE INDEX IF NOT EXISTS idx_contact_requests_created_at ON contact_requests (created_at);

DROP TRIGGER IF EXISTS trigger_update_updated_at ON contact_requests;
CREATE TRIGGER trigger_update_updated_at
    BEFORE UPDATE ON contact_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();
