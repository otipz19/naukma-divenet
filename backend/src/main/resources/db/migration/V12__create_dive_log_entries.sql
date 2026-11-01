-- Dive log (US-09). The checks are a second line behind the API.
CREATE TABLE dive_log_entries (
    id                bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id           bigint       NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    site_id           bigint       NOT NULL REFERENCES sites (id),
    dive_date         date         NOT NULL,
    max_depth         numeric(4, 1) CHECK (max_depth BETWEEN 0 AND 400),
    visibility        numeric(4, 1) CHECK (visibility BETWEEN 0 AND 200),
    water_temperature numeric(3, 1) CHECK (water_temperature BETWEEN -5 AND 40),
    -- "current" is a reserved word.
    current_strength  varchar(16)  CHECK (current_strength IN ('NONE', 'MILD', 'MODERATE', 'STRONG')),
    buddies           varchar(200),
    notes             varchar(2000),
    created_at        timestamptz  NOT NULL,
    updated_at        timestamptz  NOT NULL
);

CREATE INDEX dive_log_entries_user_date_idx ON dive_log_entries (user_id, dive_date DESC, id DESC);
CREATE INDEX dive_log_entries_site_id_idx ON dive_log_entries (site_id);
