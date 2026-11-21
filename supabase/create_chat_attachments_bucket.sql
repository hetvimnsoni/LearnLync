-- ==============================================================================
-- LearnLync: Dedicated Private Storage Bucket 'chat-attachments' & RLS Policies
-- Execute this script in your Supabase Project -> SQL Editor
-- (Leaves existing 'supabucket' completely untouched)
-- ==============================================================================

-- 1. Create the dedicated private bucket 'chat-attachments'
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'chat-attachments',
  'chat-attachments',
  false, -- STRICTLY PRIVATE BUCKET: Requires signed URLs for access
  26214400, -- 25MB maximum per file
  null -- Allows images, PDFs, office docs, audio, and archives
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 26214400;

-- 2. Ensure Row Level Security (RLS) is enabled on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Policy: Authenticated users can upload attachments to their user folder
-- File path convention: <auth.uid()>/<timestamp>_<random>_<filename>
DROP POLICY IF EXISTS "Authenticated users can upload to chat-attachments" ON storage.objects;
CREATE POLICY "Authenticated users can upload to chat-attachments"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'chat-attachments'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 4. Policy: Authenticated users can read and generate signed URLs for chat attachments
DROP POLICY IF EXISTS "Authenticated users can read chat-attachments" ON storage.objects;
CREATE POLICY "Authenticated users can read chat-attachments"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'chat-attachments'
);

-- 5. Policy: Senders can update or delete their own attachments
DROP POLICY IF EXISTS "Senders can update their own chat-attachments" ON storage.objects;
CREATE POLICY "Senders can update their own chat-attachments"
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

DROP POLICY IF EXISTS "Senders can delete their own chat-attachments" ON storage.objects;
CREATE POLICY "Senders can delete their own chat-attachments"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'chat-attachments'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 6. Create chat_attachments metadata table (optional audit tracking)
CREATE TABLE IF NOT EXISTS public.chat_attachments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  receiver_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  file_name text NOT NULL,
  file_type text NOT NULL,
  file_size bigint NOT NULL,
  storage_path text NOT NULL,
  public_url text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_chat_attachments_sender ON public.chat_attachments(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_attachments_receiver ON public.chat_attachments(receiver_id);

ALTER TABLE public.chat_attachments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Participants can view their chat attachments metadata" ON public.chat_attachments;
CREATE POLICY "Participants can view their chat attachments metadata"
ON public.chat_attachments
FOR SELECT
TO authenticated
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

DROP POLICY IF EXISTS "Senders can record chat attachments metadata" ON public.chat_attachments;
CREATE POLICY "Senders can record chat attachments metadata"
ON public.chat_attachments
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = sender_id);

GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT ALL ON TABLE public.chat_attachments TO authenticated, anon;

-- Force PostgREST schema cache reload
NOTIFY pgrst, 'reload schema';
