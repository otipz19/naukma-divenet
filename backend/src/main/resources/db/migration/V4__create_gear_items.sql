-- Fixed gear catalog (site feature). name is the English name; display names per language
-- live in the front-end locale files, keyed by code.
CREATE TABLE gear_items (
    code varchar(50)  PRIMARY KEY,
    name varchar(100) NOT NULL UNIQUE
);

INSERT INTO gear_items (code, name) VALUES
    ('compass', 'Compass'),
    ('dive-computer', 'Dive computer'),
    ('drysuit', 'Drysuit'),
    ('nitrox', 'Nitrox'),
    ('reef-hook', 'Reef hook'),
    ('smb', 'SMB'),
    ('torch', 'Torch'),
    ('twin-set', 'Twin set'),
    ('wetsuit', 'Wetsuit');
