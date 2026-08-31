-- ============================================================
-- Pillar scan agent: lightweight, manually-triggered batch scan
-- (default 12 profiles/run) that extracts content-pillar structure
-- and visual consistency from real, AI-discovered Instagram profiles.
-- Cheaper and much lighter than the full paid analysis (process-job) —
-- just enough to build a comparative research table and feed real
-- examples back into the tool's niche context.
-- ============================================================

CREATE TABLE public.pillar_scan_batches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  requested_count INT NOT NULL,
  niches TEXT[],
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE public.profile_pillar_scans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  batch_id UUID NOT NULL REFERENCES public.pillar_scan_batches(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  nicho TEXT,
  pilares_distintos INT,
  pilar_dominante TEXT,
  pilar_dominante_pct NUMERIC,
  consistencia_visual TEXT CHECK (consistencia_visual IN ('alta', 'media', 'baixa')),
  dados_performance_disponiveis BOOLEAN,
  pillars_detail JSONB NOT NULL DEFAULT '[]'::jsonb,
  scan_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_profile_pillar_scans_batch ON public.profile_pillar_scans(batch_id);
CREATE INDEX idx_profile_pillar_scans_nicho ON public.profile_pillar_scans(nicho);
CREATE INDEX idx_profile_pillar_scans_username ON public.profile_pillar_scans(username);

-- Service-role / edge-function-mediated only, same pattern as nicho_seed_accounts:
-- RLS enabled with no policies added, so it's inaccessible to anon/authenticated
-- via PostgREST directly. The Admin UI reads/writes through the pillar-scan-agent
-- edge function, which enforces the admin-email check itself.
ALTER TABLE public.pillar_scan_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_pillar_scans ENABLE ROW LEVEL SECURITY;
