-- Achievement definitions (US-10). The set of metrics is code, the targets are data; names are translated in the locale files.
CREATE TABLE achievements (
    code     varchar(50)  PRIMARY KEY,
    name     varchar(100) NOT NULL,
    metric   varchar(20)  NOT NULL
        CHECK (metric IN ('DIVES', 'SITES', 'COUNTRIES', 'DEEPEST', 'PUBLISHED_POSTS', 'APPROVED_SITES')),
    target   integer      NOT NULL CHECK (target > 0),
    position smallint     NOT NULL UNIQUE
);

INSERT INTO achievements (code, name, metric, target, position) VALUES
    ('first-dive', 'First dive', 'DIVES', 1, 1),
    ('ten-dives', 'Ten dives', 'DIVES', 10, 2),
    ('ten-sites', 'Site collector', 'SITES', 10, 3),
    ('globetrotter', 'Globetrotter', 'COUNTRIES', 5, 4),
    ('deep-diver', 'Deep diver', 'DEEPEST', 40, 5),
    ('first-post', 'First post', 'PUBLISHED_POSTS', 1, 6),
    ('five-posts', 'Storyteller', 'PUBLISHED_POSTS', 5, 7),
    ('first-site', 'Site scout', 'APPROVED_SITES', 1, 8);

-- An award is a record of what happened: it stays when the activity behind it is deleted.
CREATE TABLE user_achievements (
    user_id          bigint      NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    achievement_code varchar(50) NOT NULL REFERENCES achievements (code),
    earned_at        timestamptz NOT NULL,
    PRIMARY KEY (user_id, achievement_code)
);
