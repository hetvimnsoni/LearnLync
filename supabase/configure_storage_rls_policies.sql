-- ==============================================================================
-- LearnLync: Secure Storage RLS Policies for 'chat-attachments'
-- Execute this script in your Supabase Project -> SQL Editor
-- (Leaves existing 'supabucket' completely untouched)
-- ==============================================================================

-- 1. Ensure the bucket is strictly PRIVATE and RLS is enabled on storage.objects
UPDATE storage.buckets
SET public = false, file_size_limit = 26214400
WHERE id = 'chat-attachments';

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 2. Policy: Authenticated conversation participants can upload attachments
-- Path structure enforced: <auth.uid()>/<timestamp>_<random>_<filename>
DROP POLICY IF EXISTS "Authenticated learners can upload to chat-attachments" ON storage.objects;
CREATE POLICY "Authenticated learners can upload to chat-attachments"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'chat-attachments'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 3. Policy: Authorized participants can view and download attachments
-- Senders, connected peers via skill exchanges, and authenticated learners can view/download
DROP POLICY IF EXISTS "Authorized participants can view chat-attachments" ON storage.objects;
CREATE POLICY "Authorized participants can view chat-attachments"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'chat-attachments'
  AND (
    -- Senders can always access their own uploads
    (storage.foldername(name))[1] = auth.uid()::text
    -- Connected peer learners via skill exchanges
    OR EXISTS (
      SELECT 1 FROM public.skill_exchanges se
      WHERE (se.sender_id = auth.uid() AND se.receiver_id::text = (storage.foldername(name))[1])
         OR (se.receiver_id = auth.uid() AND se.sender_id::text = (storage.foldername(name))[1])
    )
    -- Registered learners with active profile
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
    )
  )
);

-- 4. Policy: Users can update only their own uploaded attachments
DROP POLICY IF EXISTS "Senders can update only their own chat-attachments" ON storage.objects;
CREATE POLICY "Senders can update only their own chat-attachments"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'chat-attachments'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'chat-attachments'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 5. Policy: Users can delete only their own uploaded attachments
DROP POLICY IF EXISTS "Senders can delete only their own chat-attachments" ON storage.objects;
CREATE POLICY "Senders can delete only their own chat-attachments"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'chat-attachments'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
