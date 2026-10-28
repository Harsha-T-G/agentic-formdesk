CREATE TABLE submissions (
    id UUID PRIMARY KEY,
    version BIGINT NOT NULL DEFAULT 0,
    form_id VARCHAR(32) NOT NULL DEFAULT 'contact' CHECK (form_id = 'contact'),
    status VARCHAR(16) NOT NULL CHECK (status IN ('DRAFT', 'SUBMITTED')),
    first_name VARCHAR(80) NOT NULL DEFAULT '',
    last_name VARCHAR(80) NOT NULL DEFAULT '',
    email VARCHAR(254) NOT NULL DEFAULT '',
    phone VARCHAR(40) NOT NULL DEFAULT '',
    company VARCHAR(120) NOT NULL DEFAULT '',
    role VARCHAR(32) NOT NULL DEFAULT '',
    request_type VARCHAR(16) CHECK (request_type IN ('GENERAL', 'PROJECT', 'FEEDBACK')),
    message VARCHAR(2000) NOT NULL DEFAULT '',
    consent BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    submitted_at TIMESTAMPTZ,
    CONSTRAINT submitted_fields CHECK (
      status = 'DRAFT' OR (
        length(trim(first_name)) > 0 AND length(trim(last_name)) > 0
        AND length(trim(email)) > 0 AND request_type IS NOT NULL
        AND length(trim(message)) >= 10 AND consent = TRUE AND submitted_at IS NOT NULL
      )
    )
);
CREATE INDEX submissions_status_created_idx ON submissions(status, created_at DESC);
CREATE INDEX submissions_created_idx ON submissions(created_at DESC, id DESC);
