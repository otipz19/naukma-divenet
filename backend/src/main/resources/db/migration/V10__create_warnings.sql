-- Site warnings (warning feature), US-S1 (add-site-warnings design D1).
CREATE TABLE warnings (
    id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    site_id    bigint        NOT NULL REFERENCES sites (id),
    author_id  bigint        NOT NULL REFERENCES users (id),
    type       varchar(32)   NOT NULL CHECK (type IN ('HAZARD', 'INCIDENT', 'CHANGED_CONDITIONS', 'MARINE_LIFE')),
    text       varchar(1000) NOT NULL CHECK (btrim(text) <> ''),
    created_at timestamptz   NOT NULL,
    updated_at timestamptz   NOT NULL,
    hidden_at  timestamptz,
    hidden_by  bigint        REFERENCES users (id),
    CHECK ((hidden_at IS NULL) = (hidden_by IS NULL))
);

CREATE INDEX warnings_site_visible ON warnings (site_id, created_at DESC) WHERE hidden_at IS NULL;
CREATE INDEX warnings_author_id_idx ON warnings (author_id);
