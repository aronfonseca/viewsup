
-- Allow users to delete their own reports
CREATE POLICY "Users can delete their own reports"
ON public.reports
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Harden user_feedbacks INSERT: require non-null user_id matching auth.uid()
DROP POLICY IF EXISTS "Users can submit their own feedback" ON public.user_feedbacks;

CREATE POLICY "Users can submit their own feedback"
ON public.user_feedbacks
FOR INSERT
TO authenticated
WITH CHECK (user_id IS NOT NULL AND auth.uid() = user_id);
