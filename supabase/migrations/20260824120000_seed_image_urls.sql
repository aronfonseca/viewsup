-- Real thumbnail URLs from approved seed accounts' actual posts, captured by
-- niche-benchmark-agent alongside seed_content_patterns. process-job downloads
-- a few of these per niche and sends them to Claude as real reference images,
-- so visual-identity judgment is grounded in what actually works in the niche
-- instead of an isolated (and previously inconsistent) guess about the profile
-- being analysed.
ALTER TABLE public.nicho_insights
  ADD COLUMN seed_image_urls JSONB NOT NULL DEFAULT '[]'::jsonb;
