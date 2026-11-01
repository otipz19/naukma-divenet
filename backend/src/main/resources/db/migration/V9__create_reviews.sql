-- Site reviews (review feature), US-03 and US-04. One review per user per site; blank text is stored as
-- NULL, so the database also enforces "a rating or text".
CREATE TABLE reviews (
    id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    site_id    bigint        NOT NULL REFERENCES sites (id),
    author_id  bigint        NOT NULL REFERENCES users (id),
    rating     smallint      CHECK (rating BETWEEN 1 AND 5),
    -- On the site's 1-5 difficulty scale, so the community view compares with the declared one.
    difficulty smallint      CHECK (difficulty BETWEEN 1 AND 5),
    text       varchar(4000),
    created_at timestamptz   NOT NULL,
    updated_at timestamptz   NOT NULL,
    UNIQUE (site_id, author_id),
    CHECK (rating IS NOT NULL OR text IS NOT NULL)
);

CREATE INDEX reviews_site_created ON reviews (site_id, created_at DESC);
CREATE INDEX reviews_author_id_idx ON reviews (author_id);

-- An upload belongs to one piece of content, hence UNIQUE (media_id).
CREATE TABLE review_media (
    review_id bigint   NOT NULL REFERENCES reviews (id) ON DELETE CASCADE,
    media_id  uuid     NOT NULL REFERENCES media (id),
    position  smallint NOT NULL,
    PRIMARY KEY (review_id, media_id),
    UNIQUE (media_id)
);

-- Aggregates kept by the review feature in the same transaction as every review write (design D2).
ALTER TABLE sites
    ADD COLUMN rating_average       numeric(2, 1),
    ADD COLUMN rating_count         integer NOT NULL DEFAULT 0,
    ADD COLUMN review_count         integer NOT NULL DEFAULT 0,
    ADD COLUMN community_difficulty numeric(2, 1);

CREATE INDEX sites_rating_average ON sites (rating_average DESC NULLS LAST);
