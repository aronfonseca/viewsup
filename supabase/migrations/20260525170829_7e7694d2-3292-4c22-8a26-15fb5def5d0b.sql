CREATE POLICY "Service role can update analysis jobs"
ON public.analysis_jobs FOR UPDATE
TO public
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can update video jobs"
ON public.video_jobs FOR UPDATE
TO public
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');