-- Declared certificates (US-C1). The platform never contacts an agency; an admin decides.
CREATE TABLE certificates (
    id               bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id          bigint       NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    agency           varchar(16)  NOT NULL CHECK (agency IN ('PADI', 'SSI', 'CMAS', 'OTHER')),
    level            varchar(100) NOT NULL,
    number           varchar(50)  NOT NULL,
    photo_id         uuid REFERENCES media (id) ON DELETE SET NULL,
    status           varchar(16)  NOT NULL CHECK (status IN ('PENDING', 'VERIFIED', 'REJECTED')),
    rejection_reason varchar(500),
    verified_at      timestamptz,
    created_at       timestamptz  NOT NULL,
    updated_at       timestamptz  NOT NULL,
    CHECK ((status = 'REJECTED') = (rejection_reason IS NOT NULL)),
    CHECK ((status = 'VERIFIED') = (verified_at IS NOT NULL))
);

CREATE INDEX certificates_user_created_idx ON certificates (user_id, created_at DESC);
CREATE INDEX certificates_status_created_idx ON certificates (status, created_at);
