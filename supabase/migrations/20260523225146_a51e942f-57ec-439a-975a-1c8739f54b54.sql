CREATE TABLE public.user_feedbacks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  user_email TEXT,
  type TEXT NOT NULL CHECK (type IN ('bug','suggestion')),
  message TEXT NOT NULL CHECK (length(message) BETWEEN 3 AND 5000),
  language TEXT NOT NULL DEFAULT 'en' CHECK (language IN ('en','pt')),
  page_url TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_feedbacks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can submit their own feedback"
ON public.user_feedbacks
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own feedback"
ON public.user_feedbacks
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Service role manages all feedback"
ON public.user_feedbacks
FOR ALL
TO public
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

CREATE INDEX idx_user_feedbacks_created_at ON public.user_feedbacks(created_at DESC);
CREATE INDEX idx_user_feedbacks_user_id ON public.user_feedbacks(user_id);