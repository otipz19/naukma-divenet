-- Moderation of user-submitted sites (US-07, US-08). Sites that exist already are approved.
ALTER TABLE sites
    ADD COLUMN status           varchar(16),
    ADD COLUMN author_id        bigint REFERENCES users (id) ON DELETE SET NULL,
    ADD COLUMN rejection_reason varchar(500);

UPDATE sites SET status = 'APPROVED';

ALTER TABLE sites
    ALTER COLUMN status SET NOT NULL,
    ADD CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    ADD CHECK ((status = 'REJECTED') = (rejection_reason IS NOT NULL));

CREATE INDEX sites_status_created_at_idx ON sites (status, created_at);
CREATE INDEX sites_author_id_idx ON sites (author_id);
