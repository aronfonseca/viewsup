-- Lightweight content-production calendar. Populated automatically from each
-- analysis' videoIdeas (process-job), tracked per user/profile so an operator
-- (or agency) can move a video idea through planejado -> gravando -> editando
-- -> postado without losing it when the profile gets re-analysed later.
CREATE TABLE public.content_calendar_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  username TEXT NOT NULL,
  title TEXT NOT NULL,
  format TEXT,
  hook_verbal TEXT,
  best_day TEXT,
  best_time TEXT,
  status TEXT NOT NULL DEFAULT 'planejado' CHECK (status IN ('planejado', 'gravando', 'editando', 'postado')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, username, title)
);

CREATE INDEX idx_content_calendar_items_user_username ON public.content_calendar_items(user_id, username);

ALTER TABLE public.content_calendar_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own calendar items"
ON public.content_calendar_items
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own calendar items"
ON public.content_calendar_items
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own calendar items"
ON public.content_calendar_items
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own calendar items"
ON public.content_calendar_items
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
