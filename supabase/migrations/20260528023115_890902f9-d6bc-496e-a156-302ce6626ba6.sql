ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name text;

-- Backfill existing profiles: copy display_name into full_name
UPDATE public.profiles SET full_name = display_name WHERE full_name IS NULL;

-- Recreate trigger to also populate full_name from user metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'display_name', NEW.email)
  );
  RETURN NEW;
END;
$function$;