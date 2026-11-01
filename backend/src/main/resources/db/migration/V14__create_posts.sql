-- Blog posts (US-12). published_at survives moving back to drafts, so publishing again keeps the first date.
CREATE TABLE posts (
    id           bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    author_id    bigint         NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    title        varchar(200)   NOT NULL,
    text         varchar(20000) NOT NULL,
    status       varchar(16)    NOT NULL CHECK (status IN ('DRAFT', 'PUBLISHED')),
    cover_id     uuid REFERENCES media (id) ON DELETE SET NULL,
    region_code  varchar(50) REFERENCES regions (code),
    site_id      bigint REFERENCES sites (id) ON DELETE SET NULL,
    published_at timestamptz,
    created_at   timestamptz    NOT NULL,
    updated_at   timestamptz    NOT NULL,
    CHECK (status <> 'PUBLISHED' OR published_at IS NOT NULL)
);

CREATE INDEX posts_author_published_idx ON posts (author_id, published_at DESC) WHERE status = 'PUBLISHED';
CREATE INDEX posts_author_drafts_idx ON posts (author_id, updated_at DESC) WHERE status = 'DRAFT';

CREATE TABLE post_media (
    post_id  bigint   NOT NULL REFERENCES posts (id) ON DELETE CASCADE,
    media_id uuid     NOT NULL REFERENCES media (id),
    position smallint NOT NULL,
    PRIMARY KEY (post_id, media_id),
    UNIQUE (media_id)
);
