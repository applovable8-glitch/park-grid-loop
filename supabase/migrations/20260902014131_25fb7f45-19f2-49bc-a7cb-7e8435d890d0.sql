ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS image_url text;
ALTER TABLE public.messages ALTER COLUMN body SET DEFAULT '';

DROP POLICY IF EXISTS "chat images upload own" ON storage.objects;
CREATE POLICY "chat images upload own" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'chat-images' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "chat images read own" ON storage.objects;
CREATE POLICY "chat images read own" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'chat-images' AND (storage.foldername(name))[1] = auth.uid()::text);