-- Fixed country and region hierarchy (geo feature). name is the English name; display names
-- per language live in the front-end locale files, keyed by code.
CREATE TABLE countries (
    -- ISO 3166-1 alpha-2.
    code varchar(2)   PRIMARY KEY,
    name varchar(100) NOT NULL UNIQUE
);

CREATE TABLE regions (
    -- Lower-case country code, a hyphen and a suffix, for example eg-dahab.
    code         varchar(50)  PRIMARY KEY,
    country_code varchar(2)   NOT NULL REFERENCES countries (code),
    name         varchar(100) NOT NULL,
    UNIQUE (country_code, name)
);

INSERT INTO countries (code, name) VALUES
    ('AU', 'Australia'),
    ('BZ', 'Belize'),
    ('HR', 'Croatia'),
    ('EC', 'Ecuador'),
    ('EG', 'Egypt'),
    ('GR', 'Greece'),
    ('IS', 'Iceland'),
    ('ID', 'Indonesia'),
    ('IT', 'Italy'),
    ('MY', 'Malaysia'),
    ('MV', 'Maldives'),
    ('MT', 'Malta'),
    ('MX', 'Mexico'),
    ('PW', 'Palau'),
    ('PH', 'Philippines'),
    ('PT', 'Portugal'),
    ('ZA', 'South Africa'),
    ('ES', 'Spain'),
    ('TH', 'Thailand'),
    ('TR', 'Turkey'),
    ('UA', 'Ukraine'),
    ('US', 'United States');

INSERT INTO regions (code, country_code, name) VALUES
    ('au-great-barrier-reef', 'AU', 'Great Barrier Reef'),
    ('au-western-australia', 'AU', 'Western Australia'),
    ('bz-lighthouse-reef', 'BZ', 'Lighthouse Reef'),
    ('hr-istria', 'HR', 'Istria'),
    ('hr-dalmatia', 'HR', 'Dalmatia'),
    ('ec-galapagos', 'EC', 'Galápagos'),
    ('eg-dahab', 'EG', 'Dahab'),
    ('eg-hurghada', 'EG', 'Hurghada'),
    ('eg-marsa-alam', 'EG', 'Marsa Alam'),
    ('eg-sharm-el-sheikh', 'EG', 'Sharm El Sheikh'),
    ('gr-crete', 'GR', 'Crete'),
    ('gr-santorini', 'GR', 'Santorini'),
    ('is-thingvellir', 'IS', 'Thingvellir'),
    ('id-bali', 'ID', 'Bali'),
    ('id-komodo', 'ID', 'Komodo'),
    ('id-raja-ampat', 'ID', 'Raja Ampat'),
    ('it-sardinia', 'IT', 'Sardinia'),
    ('it-sicily', 'IT', 'Sicily'),
    ('my-sipadan', 'MY', 'Sipadan'),
    ('mv-ari-atoll', 'MV', 'Ari Atoll'),
    ('mv-north-male-atoll', 'MV', 'North Malé Atoll'),
    ('mt-gozo', 'MT', 'Gozo'),
    ('mt-malta-island', 'MT', 'Malta Island'),
    ('mx-cozumel', 'MX', 'Cozumel'),
    ('mx-riviera-maya', 'MX', 'Riviera Maya'),
    ('mx-socorro', 'MX', 'Socorro Islands'),
    ('pw-koror', 'PW', 'Koror'),
    ('ph-malapascua', 'PH', 'Malapascua'),
    ('ph-palawan', 'PH', 'Palawan'),
    ('ph-tubbataha', 'PH', 'Tubbataha'),
    ('pt-azores', 'PT', 'Azores'),
    ('pt-madeira', 'PT', 'Madeira'),
    ('za-aliwal-shoal', 'ZA', 'Aliwal Shoal'),
    ('za-sodwana-bay', 'ZA', 'Sodwana Bay'),
    ('es-canary-islands', 'ES', 'Canary Islands'),
    ('es-costa-brava', 'ES', 'Costa Brava'),
    ('th-koh-tao', 'TH', 'Koh Tao'),
    ('th-similan-islands', 'TH', 'Similan Islands'),
    ('tr-kas', 'TR', 'Kaş'),
    ('ua-kyiv', 'UA', 'Kyiv Region'),
    ('ua-odesa', 'UA', 'Odesa Region'),
    ('us-florida-keys', 'US', 'Florida Keys'),
    ('us-hawaii', 'US', 'Hawaii');
