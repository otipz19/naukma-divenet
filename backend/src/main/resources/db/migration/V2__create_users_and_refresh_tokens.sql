-- Accounts (user feature) and rotating refresh tokens (auth feature), ADR-0004.
CREATE TABLE users (
    id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    -- Stored in lower case, so the unique constraint is case-insensitive.
    email         varchar(254) NOT NULL UNIQUE,
    display_name  varchar(50)  NOT NULL,
    password_hash varchar(100) NOT NULL,
    role          varchar(16)  NOT NULL CHECK (role IN ('USER', 'ADMIN')),
    created_at    timestamptz  NOT NULL
);

CREATE TABLE refresh_tokens (
    id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id    bigint      NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    -- Every token descended from one login shares a family; a replay revokes the family.
    family_id  uuid        NOT NULL,
    -- SHA-256 of the cookie value, hex encoded; the value itself is never stored.
    token_hash varchar(64) NOT NULL UNIQUE,
    created_at timestamptz NOT NULL,
    expires_at timestamptz NOT NULL,
    rotated_at timestamptz,
    revoked_at timestamptz
);

CREATE INDEX refresh_tokens_family_id_idx ON refresh_tokens (family_id);
CREATE INDEX refresh_tokens_user_id_idx ON refresh_tokens (user_id);
