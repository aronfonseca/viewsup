-- Create analysis_jobs table for async Instagram analysis
CREATE TABLE public.analysis_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  instagram_url TEXT NOT NULL,
  username TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'pt-BR',
  company_name TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  result_data JSONB,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT analysis_jobs_status_check CHECK (status IN ('pending', 'processing', 'completed', 'failed'))
);

-- Indexes for fast polling and worker queries
CREATE INDEX idx_analysis_jobs_user_id ON public.analysis_jobs(user_id);
CREATE INDEX idx_analysis_jobs_status ON public.analysis_jobs(status, created_at);

-- Enable RLS
ALTER TABLE public.analysis_jobs ENABLE ROW LEVEL SECURITY;

-- Users can view their own jobs
CREATE POLICY "Users can view their own jobs"
ON public.analysis_jobs
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can create their own jobs
CREATE POLICY "Users can create their own jobs"
ON public.analysis_jobs
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own jobs (needed for client-triggered worker pattern)
CREATE POLICY "Users can update their own jobs"
ON public.analysis_jobs
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Enable realtime for live status updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.analysis_jobs;