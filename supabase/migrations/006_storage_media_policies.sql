-- media Storage 버킷 RLS 정책
-- documents와 동일 패턴: public read + authenticated write

CREATE POLICY "media public read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'media');

CREATE POLICY "media authenticated insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'media');

CREATE POLICY "media authenticated update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'media')
WITH CHECK (bucket_id = 'media');

CREATE POLICY "media authenticated delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'media');
