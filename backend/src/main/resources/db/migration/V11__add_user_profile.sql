-- Public profile (US-11). Profiles start public; the owner opts out per section.
ALTER TABLE users
    ADD COLUMN bio               varchar(500),
    ADD COLUMN avatar_id         uuid REFERENCES media (id) ON DELETE SET NULL,
    ADD COLUMN show_dive_log     boolean NOT NULL DEFAULT true,
    ADD COLUMN show_statistics   boolean NOT NULL DEFAULT true,
    ADD COLUMN show_certificates boolean NOT NULL DEFAULT true;
