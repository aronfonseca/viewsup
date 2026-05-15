-- 1. analysis_jobs: drop user UPDATE policy (service role bypasses RLS)
DROP POLICY IF EXISTS "Users can update their own jobs" ON public.analysis_jobs;

-- 2. profile_history: drop user INSERT policy (only service role inserts)
DROP POLICY IF EXISTS "Users insert own profile history" ON public.profile_history;

-- 3. profiles: replace UPDATE policy with WITH CHECK that pins billing columns
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  AND plan = (SELECT p.plan FROM public.profiles p WHERE p.user_id = auth.uid())
  AND analyses_remaining = (SELECT p.analyses_remaining FROM public.profiles p WHERE p.user_id = auth.uid())
  AND analyses_limit = (SELECT p.analyses_limit FROM public.profiles p WHERE p.user_id = auth.uid())
  AND period_end IS NOT DISTINCT FROM (SELECT p.period_end FROM public.profiles p WHERE p.user_id = auth.uid())
);

-- 4. Revoke EXECUTE on remaining SECURITY DEFINER functions from anon/authenticated/PUBLIC
REVOKE EXECUTE ON FUNCTION public.has_active_subscription(uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_profile_privilege_escalation() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trg_recompute_nicho_after_history() FROM PUBLIC, anon, authenticated;