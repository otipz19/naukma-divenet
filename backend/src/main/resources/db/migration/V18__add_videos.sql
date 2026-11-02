-- Video attachments (ADR-0011). Videos are stored as uploaded, so they have no dimensions or thumbnail.
ALTER TABLE media
    ALTER COLUMN width DROP NOT NULL,
    ALTER COLUMN height DROP NOT NULL,
    DROP CONSTRAINT media_content_type_check,
    ADD CONSTRAINT media_content_type_check
        CHECK (content_type IN ('image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm')),
    ADD CONSTRAINT media_image_dimensions_check
        CHECK (content_type LIKE 'video/%' OR (width IS NOT NULL AND height IS NOT NULL));

-- As review_media and post_media: an upload belongs to one piece of content.
CREATE TABLE review_videos (
    review_id bigint   NOT NULL REFERENCES reviews (id) ON DELETE CASCADE,
    media_id  uuid     NOT NULL REFERENCES media (id),
    position  smallint NOT NULL,
    PRIMARY KEY (review_id, media_id),
    UNIQUE (media_id)
);

CREATE TABLE post_videos (
    post_id  bigint   NOT NULL REFERENCES posts (id) ON DELETE CASCADE,
    media_id uuid     NOT NULL REFERENCES media (id),
    position smallint NOT NULL,
    PRIMARY KEY (post_id, media_id),
    UNIQUE (media_id)
);
