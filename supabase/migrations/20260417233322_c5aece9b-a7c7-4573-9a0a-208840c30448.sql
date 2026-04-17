-- Drop overly permissive policies on video-uploads bucket
DROP POLICY IF EXISTS "Anyone can delete their videos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload videos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view videos" ON storage.objects;
DROP POLICY IF EXISTS "Public can view videos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update their videos" ON storage.objects;

-- Make bucket private
UPDATE storage.buckets SET public = false WHERE id = 'video-uploads';

-- Authenticated users can upload videos into their own folder (first path segment = user id)
CREATE POLICY "Authenticated users can upload own videos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'video-uploads'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can view their own videos
CREATE POLICY "Users can view own videos"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'video-uploads'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can update their own videos
CREATE POLICY "Users can update own videos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'video-uploads'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can delete their own videos
CREATE POLICY "Users can delete own videos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'video-uploads'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );