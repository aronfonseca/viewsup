-- 1) Defense-in-depth: column-level revoke so authenticated users can't UPDATE billing/quota columns directly
REVOKE UPDATE (plan, analyses_remaining, analyses_limit, period_end) ON public.profiles FROM authenticated, anon, public;

-- 2) Service-role DELETE policy on analysis_jobs (cleanup operations)
DROP POLICY IF EXISTS "Service role can delete analysis jobs" ON public.analysis_jobs;
CREATE POLICY "Service role can delete analysis jobs"
  ON public.analysis_jobs
  FOR DELETE
  TO public
  USING (auth.role() = 'service_role');

-- 3) Restrict EXECUTE on privileged SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION public.consume_analysis_credit(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.refund_analysis_credit(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.recompute_nicho_insights(public.profile_niche) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_analysis_credit(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.refund_analysis_credit(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.recompute_nicho_insights(public.profile_niche) TO service_role;