ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS language_pref text,
  ADD COLUMN IF NOT EXISTS country_code text;