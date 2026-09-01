-- Per-profile strategic objective/narrative, defined by the analysing user
-- (operator or agency) and persisted across future analyses of the same
-- username. process-job reads this when present and (1) evaluates how well
-- the current profile aligns with it, (2) biases videoIdeas/contentFocus/
-- scriptSuggestions toward advancing that narrative.
CREATE TABLE public.profile_objectives (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  username TEXT NOT NULL,
  objective_text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, username)
);

CREATE INDEX idx_profile_objectives_user_username ON public.profile_objectives(user_id, username);

ALTER TABLE public.profile_objectives ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile objectives"
ON public.profile_objectives
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile objectives"
ON public.profile_objectives
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile objectives"
ON public.profile_objectives
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);
