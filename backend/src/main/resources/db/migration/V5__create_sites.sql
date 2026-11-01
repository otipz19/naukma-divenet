-- Dive sites (site feature), ADR-0003. Moderation status and rating aggregates arrive with the
-- changes that use them.
CREATE TABLE sites (
    id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name        varchar(120)           NOT NULL,
    region_code varchar(50)            NOT NULL REFERENCES regions (code),
    location    geography(Point, 4326) NOT NULL,
    difficulty  integer                NOT NULL CHECK (difficulty BETWEEN 1 AND 5),
    min_depth   integer                NOT NULL CHECK (min_depth >= 0),
    max_depth   integer                NOT NULL,
    description text                   NOT NULL,
    created_at  timestamptz            NOT NULL,
    CHECK (min_depth <= max_depth)
);

CREATE INDEX sites_location_idx ON sites USING gist (location);
CREATE INDEX sites_region_code_idx ON sites (region_code);

-- The primary key is what stops a gear item from being both required and recommended.
CREATE TABLE site_gear (
    site_id     bigint      NOT NULL REFERENCES sites (id) ON DELETE CASCADE,
    gear_code   varchar(50) NOT NULL REFERENCES gear_items (code),
    requirement varchar(16) NOT NULL CHECK (requirement IN ('REQUIRED', 'RECOMMENDED')),
    PRIMARY KEY (site_id, gear_code)
);
