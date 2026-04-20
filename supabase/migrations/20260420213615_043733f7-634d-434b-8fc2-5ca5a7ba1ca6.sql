-- Extensions for background worker + http calls
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Video analysis jobs
CREATE TABLE public.video_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  storage_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT,
  language TEXT NOT NULL DEFAULT 'pt-BR',
  company_name TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  result_data JSONB,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  video_expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days')
);

CREATE INDEX idx_video_jobs_user_created ON public.video_jobs(user_id, created_at DESC);
CREATE INDEX idx_video_jobs_status ON public.video_jobs(status) WHERE status IN ('pending', 'processing');
CREATE INDEX idx_video_jobs_expires ON public.video_jobs(video_expires_at) WHERE storage_path IS NOT NULL;

ALTER TABLE public.video_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own video jobs"
  ON public.video_jobs FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own video jobs"
  ON public.video_jobs FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own video jobs"
  ON public.video_jobs FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own video jobs"
  ON public.video_jobs FOR DELETE TO authenticated
  USING (auth.uid() = user_id);