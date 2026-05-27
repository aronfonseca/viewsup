
-- 1) Reports: add explicit restrictive UPDATE deny for non-service roles
CREATE POLICY "Deny updates on reports for non-service roles"
ON public.reports
AS RESTRICTIVE
FOR UPDATE
TO anon, authenticated
USING (false)
WITH CHECK (false);

-- 2) user_feedbacks: prevent email spoofing on insert
DROP POLICY IF EXISTS "Users can submit their own feedback" ON public.user_feedbacks;

CREATE POLICY "Users can submit their own feedback"
ON public.user_feedbacks
FOR INSERT
TO authenticated
WITH CHECK (
  user_id IS NOT NULL
  AND auth.uid() = user_id
  AND (
    user_email IS NULL
    OR user_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  )
);
