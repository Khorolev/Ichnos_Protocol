-- Migration: 005_20260215_create_question_topics
-- Creates the question_topics table for AI-classified topic tagging.

CREATE TABLE IF NOT EXISTS question_topics (
    id              SERIAL PRIMARY KEY,
    question_id     INTEGER NOT NULL,
    topic           VARCHAR(255) NOT NULL,
    confidence      NUMERIC(5,4),
    model           VARCHAR(100),
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_question_topics_question
        FOREIGN KEY (question_id) REFERENCES questions (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_question_topics_question_id ON question_topics (question_id);
CREATE INDEX IF NOT EXISTS idx_question_topics_topic ON question_topics (topic);
