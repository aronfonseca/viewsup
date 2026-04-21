-- ============================================================
-- Learning system: profile_history + nicho_insights
-- ============================================================

-- Normalised niche list (Portuguese, consistent labels for aggregation)
CREATE TYPE public.profile_niche AS ENUM (
  'Imobiliaria',
  'Fitness',
  'Beleza',
  'Moda',
  'Alimentacao',
  'Educacao',
  'Tecnologia',
  'Marketing',
  'Financas',
  'Saude',
  'Coaching',
  'Ecommerce',
  'Turismo',
  'Automotivo',
  'Entretenimento',
  'Servicos',
  'B2B',
  'Lifestyle',
  'Arte',
  'Outros'
);

-- ============================================================
-- profile_history: one row per completed analysis
-- ============================================================
CREATE TABLE public.profile_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  username TEXT NOT NULL,
  instagram_url TEXT NOT NULL,
  nicho public.profile_niche NOT NULL DEFAULT 'Outros',
  pais TEXT,
  score_geral NUMERIC,
  hook_strength NUMERIC,
  retention NUMERIC,
  engagement NUMERIC,
  visual_branding NUMERIC,
  storytelling NUMERIC,
  viral_score NUMERIC,
  seguidores BIGINT,
  media_views BIGINT,
  media_likes BIGINT,
  media_comentarios BIGINT,
  problemas_detectados TEXT[] NOT NULL DEFAULT '{}',
  solucoes_sugeridas TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_profile_history_user_username
  ON public.profile_history(user_id, lower(username), created_at DESC);
CREATE INDEX idx_profile_history_nicho_created
  ON public.profile_history(nicho, created_at DESC);
CREATE INDEX idx_profile_history_username
  ON public.profile_history(lower(username), created_at DESC);

ALTER TABLE public.profile_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own profile history"
  ON public.profile_history FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own profile history"
  ON public.profile_history FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- nicho_insights: one row per niche, aggregated metrics
-- ============================================================
CREATE TABLE public.nicho_insights (
  nicho public.profile_niche NOT NULL PRIMARY KEY,
  total_analises INT NOT NULL DEFAULT 0,
  avg_score_geral NUMERIC,
  avg_hook_strength NUMERIC,
  avg_retention NUMERIC,
  avg_engagement NUMERIC,
  avg_viral_score NUMERIC,
  top_problemas JSONB NOT NULL DEFAULT '[]'::jsonb,   -- [{problema, count}]
  top_solucoes JSONB NOT NULL DEFAULT '[]'::jsonb,    -- [{solucao, count}]
  insight_text TEXT,                                  -- short AI-generated narrative
  insight_generated_at TIMESTAMPTZ,
  insight_generated_at_count INT NOT NULL DEFAULT 0,  -- total_analises when insight was generated
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.nicho_insights ENABLE ROW LEVEL SECURITY;

-- Read-only for any authenticated user (insights are anonymous aggregates)
CREATE POLICY "Authenticated users can read niche insights"
  ON public.nicho_insights FOR SELECT TO authenticated
  USING (true);

-- ============================================================
-- recompute_nicho_insights: deterministic counts + averages
-- ============================================================
CREATE OR REPLACE FUNCTION public.recompute_nicho_insights(_nicho public.profile_niche)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total INT;
  v_avg_score NUMERIC;
  v_avg_hook NUMERIC;
  v_avg_retention NUMERIC;
  v_avg_engagement NUMERIC;
  v_avg_viral NUMERIC;
  v_top_problems JSONB;
  v_top_solutions JSONB;
BEGIN
  SELECT
    COUNT(*),
    AVG(score_geral),
    AVG(hook_strength),
    AVG(retention),
    AVG(engagement),
    AVG(viral_score)
  INTO v_total, v_avg_score, v_avg_hook, v_avg_retention, v_avg_engagement, v_avg_viral
  FROM public.profile_history
  WHERE nicho = _nicho;

  -- Top problems (frequency count, top 5)
  SELECT COALESCE(jsonb_agg(jsonb_build_object('problema', problema, 'count', cnt) ORDER BY cnt DESC), '[]'::jsonb)
  INTO v_top_problems
  FROM (
    SELECT problema, COUNT(*) AS cnt
    FROM public.profile_history,
         LATERAL unnest(problemas_detectados) AS problema
    WHERE nicho = _nicho AND length(problema) > 0
    GROUP BY problema
    ORDER BY cnt DESC
    LIMIT 5
  ) t;

  -- Top solutions (frequency count, top 5)
  SELECT COALESCE(jsonb_agg(jsonb_build_object('solucao', solucao, 'count', cnt) ORDER BY cnt DESC), '[]'::jsonb)
  INTO v_top_solutions
  FROM (
    SELECT solucao, COUNT(*) AS cnt
    FROM public.profile_history,
         LATERAL unnest(solucoes_sugeridas) AS solucao
    WHERE nicho = _nicho AND length(solucao) > 0
    GROUP BY solucao
    ORDER BY cnt DESC
    LIMIT 5
  ) t;

  INSERT INTO public.nicho_insights AS ni (
    nicho, total_analises,
    avg_score_geral, avg_hook_strength, avg_retention, avg_engagement, avg_viral_score,
    top_problemas, top_solucoes, updated_at
  ) VALUES (
    _nicho, v_total,
    v_avg_score, v_avg_hook, v_avg_retention, v_avg_engagement, v_avg_viral,
    v_top_problems, v_top_solutions, now()
  )
  ON CONFLICT (nicho) DO UPDATE SET
    total_analises = EXCLUDED.total_analises,
    avg_score_geral = EXCLUDED.avg_score_geral,
    avg_hook_strength = EXCLUDED.avg_hook_strength,
    avg_retention = EXCLUDED.avg_retention,
    avg_engagement = EXCLUDED.avg_engagement,
    avg_viral_score = EXCLUDED.avg_viral_score,
    top_problemas = EXCLUDED.top_problemas,
    top_solucoes = EXCLUDED.top_solucoes,
    updated_at = now();
END;
$$;

-- ============================================================
-- Trigger: recompute aggregates whenever a new profile_history row is added
-- ============================================================
CREATE OR REPLACE FUNCTION public.trg_recompute_nicho_after_history()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.recompute_nicho_insights(NEW.nicho);
  RETURN NEW;
END;
$$;

CREATE TRIGGER recompute_nicho_after_history
AFTER INSERT ON public.profile_history
FOR EACH ROW
EXECUTE FUNCTION public.trg_recompute_nicho_after_history();
