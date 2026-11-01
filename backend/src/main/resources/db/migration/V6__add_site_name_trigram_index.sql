-- Backs ILIKE name search, ADR-0003.
CREATE INDEX sites_name_trgm_idx ON sites USING gin (name gin_trgm_ops);
