CREATE TABLE public.reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT NOT NULL,
  profile_url TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'pt-BR',
  analysis_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert reports"
ON public.reports
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can read reports"
ON public.reports
FOR SELECT
USING (true);

CREATE INDEX idx_reports_username ON public.reports (username);
CREATE INDEX idx_reports_created_at ON public.reports (created_at DESC);