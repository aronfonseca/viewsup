-- ============================================================
-- Niche benchmark seed accounts: admin-curated real Instagram
-- handles used as reference points per niche, independent of
-- organic (paid) user analyses in profile_history.
-- ============================================================

CREATE TABLE public.nicho_seed_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nicho public.profile_niche NOT NULL,
  username TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (nicho, username)
);

CREATE INDEX idx_nicho_seed_accounts_nicho ON public.nicho_seed_accounts(nicho);

-- Service-role only: this table is curated by an admin directly (SQL editor)
-- and consumed by the niche-benchmark-agent edge function. No RLS policies
-- are added for authenticated/anon, so it stays inaccessible from the app
-- and from PostgREST for regular users (RLS enabled, default-deny).
ALTER TABLE public.nicho_seed_accounts ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- nicho_insights: add columns for real scraped seed-account
-- benchmarks, kept separate from avg_* columns (which are
-- computed only from real user-submitted profile_history rows).
-- ============================================================
ALTER TABLE public.nicho_insights
  ADD COLUMN seed_profiles_sampled INT NOT NULL DEFAULT 0,
  ADD COLUMN seed_avg_followers BIGINT,
  ADD COLUMN seed_avg_likes NUMERIC,
  ADD COLUMN seed_avg_comments NUMERIC,
  ADD COLUMN seed_engagement_rate NUMERIC,
  ADD COLUMN seed_examples JSONB NOT NULL DEFAULT '[]'::jsonb, -- [{username, followers, avgLikes, avgComments}]
  ADD COLUMN seed_updated_at TIMESTAMPTZ;
