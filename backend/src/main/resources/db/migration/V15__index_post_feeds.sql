-- The feeds (US-13, US-15, US-16) read published posts only, newest first. A country filter joins regions and uses the first.
CREATE INDEX posts_feed_idx ON posts (published_at DESC, id DESC) WHERE status = 'PUBLISHED';
CREATE INDEX posts_region_feed_idx ON posts (region_code, published_at DESC) WHERE status = 'PUBLISHED';
CREATE INDEX posts_site_feed_idx ON posts (site_id, published_at DESC) WHERE status = 'PUBLISHED';
