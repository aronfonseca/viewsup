
INSERT INTO storage.buckets (id, name, public)
VALUES ('video-uploads', 'video-uploads', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can upload videos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'video-uploads');

CREATE POLICY "Anyone can read videos"
ON storage.objects FOR SELECT
USING (bucket_id = 'video-uploads');

CREATE POLICY "Anyone can delete their videos"
ON storage.objects FOR DELETE
USING (bucket_id = 'video-uploads');
