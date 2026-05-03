
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS agency_name TEXT,
  ADD COLUMN IF NOT EXISTS agency_logo_url TEXT,
  ADD COLUMN IF NOT EXISTS agency_primary_color TEXT,
  ADD COLUMN IF NOT EXISTS agency_website TEXT;

-- Storage bucket for agency logos (public so they can be embedded in PDFs)
INSERT INTO storage.buckets (id, name, public)
VALUES ('agency-logos', 'agency-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Public can read logos
CREATE POLICY "Agency logos are publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'agency-logos');

-- Owner-only upload/update/delete (folder = user_id)
CREATE POLICY "Users can upload their own agency logo"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'agency-logos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own agency logo"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'agency-logos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own agency logo"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'agency-logos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
