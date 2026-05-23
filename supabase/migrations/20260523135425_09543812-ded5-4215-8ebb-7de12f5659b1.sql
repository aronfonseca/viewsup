
-- 1) Subscriptions: restrict SELECT policy to authenticated only
DROP POLICY IF EXISTS "Users can view own subscription" ON public.subscriptions;
CREATE POLICY "Users can view own subscription"
ON public.subscriptions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 2) Video jobs: restrict UPDATE so users cannot tamper with system-managed fields
DROP POLICY IF EXISTS "Users can update their own video jobs" ON public.video_jobs;

CREATE POLICY "Users can update safe fields on their own video jobs"
ON public.video_jobs
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  AND status        = (SELECT v.status        FROM public.video_jobs v WHERE v.id = video_jobs.id)
  AND result_data   IS NOT DISTINCT FROM (SELECT v.result_data   FROM public.video_jobs v WHERE v.id = video_jobs.id)
  AND error_message IS NOT DISTINCT FROM (SELECT v.error_message FROM public.video_jobs v WHERE v.id = video_jobs.id)
  AND storage_path  = (SELECT v.storage_path  FROM public.video_jobs v WHERE v.id = video_jobs.id)
  AND file_name     = (SELECT v.file_name     FROM public.video_jobs v WHERE v.id = video_jobs.id)
  AND file_size     IS NOT DISTINCT FROM (SELECT v.file_size     FROM public.video_jobs v WHERE v.id = video_jobs.id)
  AND mime_type     IS NOT DISTINCT FROM (SELECT v.mime_type     FROM public.video_jobs v WHERE v.id = video_jobs.id)
  AND started_at    IS NOT DISTINCT FROM (SELECT v.started_at    FROM public.video_jobs v WHERE v.id = video_jobs.id)
  AND completed_at  IS NOT DISTINCT FROM (SELECT v.completed_at  FROM public.video_jobs v WHERE v.id = video_jobs.id)
  AND video_expires_at IS NOT DISTINCT FROM (SELECT v.video_expires_at FROM public.video_jobs v WHERE v.id = video_jobs.id)
);
