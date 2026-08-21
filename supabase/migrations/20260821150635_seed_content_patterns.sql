-- Real video content patterns extracted from the actual scraped posts of
-- approved seed accounts (captions, formats, engagement) — distinct from
-- nicho_insights.viral_patterns, which comes from niche-research-agent's
-- web search and isn't grounded in any specific account's real posts.
ALTER TABLE public.nicho_insights
  ADD COLUMN seed_content_patterns JSONB NOT NULL DEFAULT '[]'::jsonb;
