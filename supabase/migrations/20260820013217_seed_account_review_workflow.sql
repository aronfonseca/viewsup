-- ============================================================
-- Seed account review workflow: AI-suggested reference accounts
-- go in as 'pending' and only get scraped by niche-benchmark-agent
-- once an admin approves them via the Admin UI. Manually-inserted
-- rows (admin curating directly via SQL) default to 'approved'
-- since inserting one is itself the approval step.
-- ============================================================
ALTER TABLE public.nicho_seed_accounts
  ADD COLUMN status TEXT NOT NULL DEFAULT 'approved',
  ADD COLUMN suggested_by TEXT NOT NULL DEFAULT 'manual',
  ADD COLUMN reasoning TEXT,
  ADD COLUMN source TEXT;

ALTER TABLE public.nicho_seed_accounts
  ADD CONSTRAINT nicho_seed_accounts_status_check
    CHECK (status IN ('pending', 'approved', 'rejected'));

ALTER TABLE public.nicho_seed_accounts
  ADD CONSTRAINT nicho_seed_accounts_suggested_by_check
    CHECK (suggested_by IN ('manual', 'ai'));

CREATE INDEX idx_nicho_seed_accounts_status ON public.nicho_seed_accounts(status);
