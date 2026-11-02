-- A diver's own equipment, by free-text name; the seeded gear_items are what sites ask for.
CREATE TABLE locker_items (
    id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id    bigint       NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    name       varchar(100) NOT NULL,
    created_at timestamptz  NOT NULL
);

CREATE INDEX locker_items_user_idx ON locker_items (user_id);
