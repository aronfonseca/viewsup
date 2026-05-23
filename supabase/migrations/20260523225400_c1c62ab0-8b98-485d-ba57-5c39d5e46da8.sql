-- Explicitly deny UPDATE on analysis_jobs to authenticated/anon (service_role bypasses RLS)
REVOKE UPDATE, DELETE ON public.analysis_jobs FROM authenticated, anon;

-- Explicitly deny INSERT/UPDATE/DELETE on profile_history to authenticated/anon
REVOKE INSERT, UPDATE, DELETE ON public.profile_history FROM authenticated, anon;

-- Add restrictive deny policies as defense-in-depth
CREATE POLICY "Deny update for non-service roles"
ON public.analysis_jobs
AS RESTRICTIVE
FOR UPDATE
TO authenticated, anon
USING (false)
WITH CHECK (false);

CREATE POLICY "Deny writes for non-service roles"
ON public.profile_history
AS RESTRICTIVE
FOR INSERT
TO authenticated, anon
WITH CHECK (false);

CREATE POLICY "Deny updates for non-service roles"
ON public.profile_history
AS RESTRICTIVE
FOR UPDATE
TO authenticated, anon
USING (false)
WITH CHECK (false);

CREATE POLICY "Deny deletes for non-service roles"
ON public.profile_history
AS RESTRICTIVE
FOR DELETE
TO authenticated, anon
USING (false);