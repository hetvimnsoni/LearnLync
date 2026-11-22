-- ==============================================================================
-- LearnLync: Production Storage & Metadata RLS Migration for 'chat-attachments'
--
-- AUDIT INSTRUCTIONS FOR OPERATOR BEFORE APPLYING THIS MIGRATION:
-- Step A: Run the following read-only queries in your Supabase SQL Editor:
--
--   -- 1. Inspect all policies on storage.objects:
--   SELECT
--     policyname,
--     permissive,
--     roles,
--     cmd,
--     qual,
--     with_check
--   FROM pg_policies
--   WHERE schemaname = 'storage' AND tablename = 'objects'
--   ORDER BY cmd, policyname;
--
--   -- 2. Inspect all policies on public.chat_attachments (if table exists):
--   SELECT
--     policyname,
--     permissive,
--     roles,
--     cmd,
--     qual,
--     with_check
--   FROM pg_policies
--   WHERE schemaname = 'public' AND tablename = 'chat_attachments'
--   ORDER BY cmd, policyname;
--
-- Step B: Inspect the results.
--   PostgreSQL RLS evaluates multiple policies for the same role and action
--   using permissive OR logic. If any unhandled policy exists on storage.objects
--   that grants access to 'chat-attachments' (e.g. without bucket/path restriction,
--   or granting blanket authenticated SELECT), it will bypass the strict
--   recipient authorization defined below.
--   Note: Step 2 of this script automatically drops all KNOWN legacy policies
--   targeting 'chat-attachments' without touching policies belonging exclusively
--   to unrelated buckets (e.g. 'avatars', 'supabucket').
--   Unknown or custom policies cannot be dropped blindly. If your audit shows
--   any custom policies granting broad access, drop or restrict them prior to
--   executing this migration.
--
-- Step C: Configure bucket settings via Supabase Dashboard / Storage API:
--   - Bucket Name: chat-attachments
--   - Public Bucket: false (STRICTLY PRIVATE: requires signed URLs for access)
--   - File Size Limit: 26214400 bytes (25MB)
--   - Allowed MIME types (Exactly 35 explicit entries; excludes application/octet-stream and text/html):
--       1.  application/gzip
--       2.  application/json
--       3.  application/msword
--       4.  application/pdf
--       5.  application/rtf
--       6.  application/vnd.ms-excel
--       7.  application/vnd.ms-powerpoint
--       8.  application/vnd.openxmlformats-officedocument.presentationml.presentation
--       9.  application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
--       10. application/vnd.openxmlformats-officedocument.wordprocessingml.document
--       11. application/vnd.rar
--       12. application/x-7z-compressed
--       13. application/x-rar-compressed
--       14. application/x-tar
--       15. application/x-zip-compressed
--       16. application/zip
--       17. audio/aac
--       18. audio/m4a
--       19. audio/mp4
--       20. audio/mpeg
--       21. audio/ogg
--       22. audio/wav
--       23. audio/webm
--       24. audio/x-m4a
--       25. image/avif
--       26. image/gif
--       27. image/heic
--       28. image/heif
--       29. image/jpeg
--       30. image/png
--       31. image/svg+xml
--       32. image/webp
--       33. text/csv
--       34. text/markdown
--       35. text/plain
--
--   SECURITY NOTE ON MIME ALLOWLIST:
--   The bucket-level allowed_mime_types setting validates the declared HTTP
--   Content-Type header supplied during upload. It does NOT inspect file magic
--   bytes or guarantee byte safety. The application mitigates client-side execution
--   by sandboxing SVGs (rendering them as downloadable files with the download
--   attribute rather than inline images) and enforcing short-lived signed URLs.
--
-- Step D: Review and execute this migration script.
-- ==============================================================================

BEGIN;

-- ------------------------------------------------------------------------------
-- STEP 1: Setup, Validate & Upgrade public.chat_attachments Metadata Table (FIRST)
-- Must exist with valid types, constraints, and RLS active BEFORE storage policies reference it.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.chat_attachments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  receiver_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  file_name text NOT NULL,
  file_type text NOT NULL,
  file_size bigint NOT NULL,
  storage_path text NOT NULL,
  public_url text DEFAULT '',
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Upgrade existing installations: safely add any missing columns without data loss
ALTER TABLE public.chat_attachments ADD COLUMN IF NOT EXISTS sender_id uuid;
ALTER TABLE public.chat_attachments ADD COLUMN IF NOT EXISTS receiver_id uuid;
ALTER TABLE public.chat_attachments ADD COLUMN IF NOT EXISTS file_name text;
ALTER TABLE public.chat_attachments ADD COLUMN IF NOT EXISTS file_type text;
ALTER TABLE public.chat_attachments ADD COLUMN IF NOT EXISTS file_size bigint;
ALTER TABLE public.chat_attachments ADD COLUMN IF NOT EXISTS storage_path text;
ALTER TABLE public.chat_attachments ADD COLUMN IF NOT EXISTS public_url text DEFAULT '';
ALTER TABLE public.chat_attachments ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- Ensure public_url has a safe default and is nullable (signed URLs expire; storage_path is canonical)
ALTER TABLE public.chat_attachments ALTER COLUMN public_url SET DEFAULT '';
ALTER TABLE public.chat_attachments ALTER COLUMN public_url DROP NOT NULL;
ALTER TABLE public.chat_attachments ALTER COLUMN id SET DEFAULT gen_random_uuid();


-- ------------------------------------------------------------------------------
-- STEP 1.1: Pre-flight Diagnostics: Strict Type Checks, NULL Checks & Invariant Validation
-- Preserves all historical records; halts safely with clear exceptions if data or schema is incompatible.
-- ------------------------------------------------------------------------------
DO $$
DECLARE
  v_col_type text;
  v_pk_name text;
  v_conv_data_type text;
  v_conv_is_generated text;
  v_conv_expr text;
  v_null_id integer := 0;
  v_null_sender integer := 0;
  v_null_receiver integer := 0;
  v_null_name integer := 0;
  v_null_type integer := 0;
  v_null_size integer := 0;
  v_null_path integer := 0;
  v_null_created integer := 0;
  v_self_count integer := 0;
  v_invalid_path_count integer := 0;
  v_orphan_fk_count integer := 0;
  v_invalid_size_count integer := 0;
  v_total_rows integer := 0;
BEGIN
  SELECT count(*) INTO v_total_rows FROM public.chat_attachments;

  -- A. Strict Data Type & Primary Key Verification on Existing Columns
  -- 1. id column existence and data type verification
  SELECT data_type INTO v_col_type
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'chat_attachments' AND column_name = 'id';

  IF v_col_type IS NULL THEN
    RAISE EXCEPTION 'Migration halted: public.chat_attachments is missing the required column id (expected id uuid PRIMARY KEY).';
  ELSIF v_col_type <> 'uuid' THEN
    RAISE EXCEPTION 'Migration halted: public.chat_attachments.id has data type %, expected uuid.', v_col_type;
  END IF;

  -- Verify single-column validated primary key on id
  SELECT c.conname INTO v_pk_name
  FROM pg_constraint c
  JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = c.conkey[1]
  WHERE c.conrelid = 'public.chat_attachments'::regclass
    AND c.contype = 'p'
    AND c.convalidated = true
    AND array_length(c.conkey, 1) = 1
    AND a.attname = 'id';

  IF v_pk_name IS NULL THEN
    RAISE EXCEPTION 'Migration halted: public.chat_attachments does not have a validated single-column primary key on column id.';
  END IF;

  -- 2. sender_id and receiver_id type verification
  SELECT data_type INTO v_col_type
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'chat_attachments' AND column_name = 'sender_id';
  IF v_col_type IS NOT NULL AND v_col_type <> 'uuid' THEN
    RAISE EXCEPTION 'Migration halted: public.chat_attachments.sender_id has data type %, expected uuid.', v_col_type;
  END IF;

  SELECT data_type INTO v_col_type
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'chat_attachments' AND column_name = 'receiver_id';
  IF v_col_type IS NOT NULL AND v_col_type <> 'uuid' THEN
    RAISE EXCEPTION 'Migration halted: public.chat_attachments.receiver_id has data type %, expected uuid.', v_col_type;
  END IF;

  -- 3. file_name, file_type, and storage_path type verification
  SELECT data_type INTO v_col_type
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'chat_attachments' AND column_name = 'file_name';
  IF v_col_type IS NOT NULL AND v_col_type NOT IN ('text', 'character varying') THEN
    RAISE EXCEPTION 'Migration halted: public.chat_attachments.file_name has data type %, expected text.', v_col_type;
  END IF;

  SELECT data_type INTO v_col_type
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'chat_attachments' AND column_name = 'file_type';
  IF v_col_type IS NOT NULL AND v_col_type NOT IN ('text', 'character varying') THEN
    RAISE EXCEPTION 'Migration halted: public.chat_attachments.file_type has data type %, expected text.', v_col_type;
  END IF;

  SELECT data_type INTO v_col_type
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'chat_attachments' AND column_name = 'storage_path';
  IF v_col_type IS NOT NULL AND v_col_type NOT IN ('text', 'character varying') THEN
    RAISE EXCEPTION 'Migration halted: public.chat_attachments.storage_path has data type %, expected text.', v_col_type;
  END IF;

  -- 4. created_at: Strictly require timestamp with time zone (timestamptz). Do not silently accept without time zone.
  SELECT data_type INTO v_col_type
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'chat_attachments' AND column_name = 'created_at';
  IF v_col_type IS NOT NULL AND v_col_type <> 'timestamp with time zone' THEN
    RAISE EXCEPTION 'Migration halted: public.chat_attachments.created_at has data type %, expected timestamp with time zone. Existing timestamp without time zone columns will not be silently accepted.', v_col_type;
  END IF;

  -- 5. file_size: Strictly require integer types (bigint, integer, smallint) or validate numeric integrality and bigint range
  SELECT data_type INTO v_col_type
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'chat_attachments' AND column_name = 'file_size';
  IF v_col_type IS NOT NULL AND v_col_type NOT IN ('bigint', 'integer', 'smallint') THEN
    IF v_col_type = 'numeric' THEN
      SELECT count(*) INTO v_invalid_size_count
      FROM public.chat_attachments
      WHERE file_size IS NOT NULL
        AND (file_size % 1 <> 0 OR file_size < 0 OR file_size > 9223372036854775807);
      IF v_invalid_size_count > 0 THEN
        RAISE EXCEPTION 'Migration halted: public.chat_attachments.file_size has % row(s) with non-integer, negative, or out-of-range numeric values.', v_invalid_size_count;
      END IF;
    ELSE
      RAISE EXCEPTION 'Migration halted: public.chat_attachments.file_size has data type %, expected integer type (bigint, integer, smallint).', v_col_type;
    END IF;
  END IF;

  -- Validate non-negative file sizes
  SELECT count(*) INTO v_invalid_size_count
  FROM public.chat_attachments
  WHERE file_size IS NOT NULL AND file_size < 0;
  IF v_invalid_size_count > 0 THEN
    RAISE EXCEPTION 'Migration halted: public.chat_attachments contains % row(s) with negative file_size.', v_invalid_size_count;
  END IF;

  -- 6. conversation_id: If column already exists, validate type, generated status, and semantic generation expression
  SELECT data_type, is_generated, generation_expression
  INTO v_conv_data_type, v_conv_is_generated, v_conv_expr
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'chat_attachments' AND column_name = 'conversation_id';

  IF v_conv_data_type IS NOT NULL THEN
    IF v_conv_data_type <> 'text' THEN
      RAISE EXCEPTION 'Migration halted: public.chat_attachments.conversation_id has data type %, expected text.', v_conv_data_type;
    END IF;

    IF v_conv_is_generated IS NULL OR v_conv_is_generated <> 'ALWAYS' THEN
      RAISE EXCEPTION 'Migration halted: public.chat_attachments.conversation_id is not GENERATED ALWAYS (found: %). Pre-existing non-generated columns cannot be silently accepted.', COALESCE(v_conv_is_generated, 'NEVER');
    END IF;

    -- Semantically verify expression: least(sender_id, receiver_id) followed by '_' separator followed by greatest(sender_id, receiver_id), all cast to text
    IF v_conv_expr IS NULL
       OR v_conv_expr !~* '^\(*\s*least\s*\(\s*sender_id\s*,\s*receiver_id\s*\)\s*\)*::text\s*\|\|\s*''_''(?:::text)?\s*\)*\s*\|\|\s*\(*\s*greatest\s*\(\s*sender_id\s*,\s*receiver_id\s*\)\s*\)*::text\s*\)*$' THEN
      RAISE EXCEPTION 'Migration halted: public.chat_attachments.conversation_id has incompatible generation expression: %. Expected deterministic symmetric expression: least(sender_id, receiver_id)::text || ''_'' || greatest(sender_id, receiver_id)::text.', v_conv_expr;
    END IF;
  END IF;

  -- B. NULL Value Checks on Required Columns
  SELECT count(*) INTO v_null_id FROM public.chat_attachments WHERE id IS NULL;
  SELECT count(*) INTO v_null_sender FROM public.chat_attachments WHERE sender_id IS NULL;
  SELECT count(*) INTO v_null_receiver FROM public.chat_attachments WHERE receiver_id IS NULL;
  SELECT count(*) INTO v_null_name FROM public.chat_attachments WHERE file_name IS NULL;
  SELECT count(*) INTO v_null_type FROM public.chat_attachments WHERE file_type IS NULL;
  SELECT count(*) INTO v_null_size FROM public.chat_attachments WHERE file_size IS NULL;
  SELECT count(*) INTO v_null_path FROM public.chat_attachments WHERE storage_path IS NULL;
  SELECT count(*) INTO v_null_created FROM public.chat_attachments WHERE created_at IS NULL;

  IF v_null_id > 0 OR v_null_sender > 0 OR v_null_receiver > 0 OR v_null_name > 0 OR v_null_type > 0 OR v_null_size > 0 OR v_null_path > 0 OR v_null_created > 0 THEN
    RAISE EXCEPTION 'Migration halted: public.chat_attachments contains NULL in required columns (id: %, sender_id: %, receiver_id: %, file_name: %, file_type: %, file_size: %, storage_path: %, created_at: %). Required columns cannot be enforced as NOT NULL without manual data cleanup. All % historical records remain preserved.',
      v_null_id, v_null_sender, v_null_receiver, v_null_name, v_null_type, v_null_size, v_null_path, v_null_created, v_total_rows;
  END IF;

  -- C. Security Invariant: Check for Self-Attachments
  SELECT count(*) INTO v_self_count
  FROM public.chat_attachments
  WHERE sender_id = receiver_id;

  IF v_self_count > 0 THEN
    RAISE EXCEPTION 'Migration halted: public.chat_attachments contains % historical row(s) where sender_id = receiver_id. Please resolve these records before applying constraints. All % historical records remain preserved.',
      v_self_count, v_total_rows;
  END IF;

  -- D. Security Invariant: Check for Storage Path Prefix Matching Sender Directory
  SELECT count(*) INTO v_invalid_path_count
  FROM public.chat_attachments
  WHERE NOT (storage_path LIKE (sender_id::text || '/%'));

  IF v_invalid_path_count > 0 THEN
    RAISE EXCEPTION 'Migration halted: public.chat_attachments contains % historical row(s) where storage_path does not start with sender_id. Please resolve these records before applying constraints. All % historical records remain preserved.',
      v_invalid_path_count, v_total_rows;
  END IF;

  -- E. Referential Integrity: Check for Orphan Profiles
  SELECT count(*) INTO v_orphan_fk_count
  FROM public.chat_attachments ca
  WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = ca.sender_id)
     OR NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = ca.receiver_id);

  IF v_orphan_fk_count > 0 THEN
    RAISE EXCEPTION 'Migration halted: public.chat_attachments contains % historical row(s) referencing non-existent profile IDs. Please resolve these records before applying foreign keys. All % historical records remain preserved.',
      v_orphan_fk_count, v_total_rows;
  END IF;

  RAISE NOTICE 'Pre-flight diagnostics passed successfully. Total historical records: %', v_total_rows;
END $$;


-- ------------------------------------------------------------------------------
-- STEP 1.2: Enforce NOT NULL & Safely Convert file_size to bigint
-- Executed only after all existing data, columns, and types have been thoroughly validated.
-- ------------------------------------------------------------------------------
ALTER TABLE public.chat_attachments ALTER COLUMN file_size TYPE bigint;

ALTER TABLE public.chat_attachments ALTER COLUMN id SET NOT NULL;
ALTER TABLE public.chat_attachments ALTER COLUMN sender_id SET NOT NULL;
ALTER TABLE public.chat_attachments ALTER COLUMN receiver_id SET NOT NULL;
ALTER TABLE public.chat_attachments ALTER COLUMN file_name SET NOT NULL;
ALTER TABLE public.chat_attachments ALTER COLUMN file_type SET NOT NULL;
ALTER TABLE public.chat_attachments ALTER COLUMN file_size SET NOT NULL;
ALTER TABLE public.chat_attachments ALTER COLUMN storage_path SET NOT NULL;
ALTER TABLE public.chat_attachments ALTER COLUMN created_at SET NOT NULL;


-- ------------------------------------------------------------------------------
-- STEP 1.3: Add Deterministic conversation_id Generated Column
-- Added AFTER column validation to ensure sender_id and receiver_id are valid uuids.
-- If column already exists, Step 1.1 validated its type and generation expression.
-- ------------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'chat_attachments'
      AND column_name = 'conversation_id'
  ) THEN
    ALTER TABLE public.chat_attachments
      ADD COLUMN conversation_id text GENERATED ALWAYS AS (
        least(sender_id, receiver_id)::text || '_' || greatest(sender_id, receiver_id)::text
      ) STORED;
  END IF;
END $$;


-- ------------------------------------------------------------------------------
-- STEP 1.4: Safe Foreign Key & Check Constraint Additions
-- Rigorously verifies actual foreign key and check definitions in pg_constraint.
-- Verifies source & target columns, ON DELETE CASCADE, and convalidated = true.
-- Deduplicates redundant foreign keys and check constraints.
-- Eliminates brittle string matching and handles internal decompiled operator
-- representations (~~ vs LIKE, <> vs !=) with strict exact expression verification.
-- ------------------------------------------------------------------------------
DO $$
DECLARE
  v_existing_fk_name text;
  v_sender_attnum smallint;
  v_receiver_attnum smallint;
  v_path_attnum smallint;
  v_self_conname text;
  v_path_conname text;
  r RECORD;
BEGIN
  -- Obtain exact attribute numbers for semantic column-level constraint verification
  SELECT attnum INTO v_sender_attnum
  FROM pg_attribute
  WHERE attrelid = 'public.chat_attachments'::regclass AND attname = 'sender_id';

  SELECT attnum INTO v_receiver_attnum
  FROM pg_attribute
  WHERE attrelid = 'public.chat_attachments'::regclass AND attname = 'receiver_id';

  SELECT attnum INTO v_path_attnum
  FROM pg_attribute
  WHERE attrelid = 'public.chat_attachments'::regclass AND attname = 'storage_path';

  -- 1. Verify actual foreign key pointing to public.profiles(id) for sender_id
  SELECT c.conname INTO v_existing_fk_name
  FROM pg_constraint c
  JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = c.conkey[1]
  JOIN pg_attribute ref_a ON ref_a.attrelid = c.confrelid AND ref_a.attnum = c.confkey[1]
  WHERE c.conrelid = 'public.chat_attachments'::regclass
    AND c.confrelid = 'public.profiles'::regclass
    AND c.contype = 'f'
    AND array_length(c.conkey, 1) = 1
    AND a.attname = 'sender_id'
    AND ref_a.attname = 'id'
    AND c.confdeltype = 'c'
    AND c.convalidated = true
  ORDER BY (c.conname = 'chat_attachments_sender_id_fkey') DESC
  LIMIT 1;

  IF v_existing_fk_name IS NOT NULL THEN
    RAISE NOTICE 'Verified existing validated foreign key on sender_id: %', v_existing_fk_name;
    -- Deduplicate: Drop any redundant equivalent foreign keys on sender_id pointing to public.profiles(id)
    FOR r IN (
      SELECT c.conname
      FROM pg_constraint c
      JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = c.conkey[1]
      JOIN pg_attribute ref_a ON ref_a.attrelid = c.confrelid AND ref_a.attnum = c.confkey[1]
      WHERE c.conrelid = 'public.chat_attachments'::regclass
        AND c.confrelid = 'public.profiles'::regclass
        AND c.contype = 'f'
        AND array_length(c.conkey, 1) = 1
        AND a.attname = 'sender_id'
        AND ref_a.attname = 'id'
        AND c.conname <> v_existing_fk_name
    ) LOOP
      EXECUTE format('ALTER TABLE public.chat_attachments DROP CONSTRAINT %I', r.conname);
      RAISE NOTICE 'Dropped redundant duplicate foreign key on sender_id: %', r.conname;
    END LOOP;
  ELSE
    ALTER TABLE public.chat_attachments DROP CONSTRAINT IF EXISTS chat_attachments_sender_id_fkey;
    ALTER TABLE public.chat_attachments
      ADD CONSTRAINT chat_attachments_sender_id_fkey
      FOREIGN KEY (sender_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    -- Deduplicate: Drop any other stale/unvalidated foreign keys on sender_id
    FOR r IN (
      SELECT c.conname
      FROM pg_constraint c
      JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = c.conkey[1]
      JOIN pg_attribute ref_a ON ref_a.attrelid = c.confrelid AND ref_a.attnum = c.confkey[1]
      WHERE c.conrelid = 'public.chat_attachments'::regclass
        AND c.confrelid = 'public.profiles'::regclass
        AND c.contype = 'f'
        AND array_length(c.conkey, 1) = 1
        AND a.attname = 'sender_id'
        AND ref_a.attname = 'id'
        AND c.conname <> 'chat_attachments_sender_id_fkey'
    ) LOOP
      EXECUTE format('ALTER TABLE public.chat_attachments DROP CONSTRAINT %I', r.conname);
      RAISE NOTICE 'Dropped stale foreign key on sender_id: %', r.conname;
    END LOOP;
  END IF;

  -- 2. Verify actual foreign key pointing to public.profiles(id) for receiver_id
  v_existing_fk_name := NULL;
  SELECT c.conname INTO v_existing_fk_name
  FROM pg_constraint c
  JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = c.conkey[1]
  JOIN pg_attribute ref_a ON ref_a.attrelid = c.confrelid AND ref_a.attnum = c.confkey[1]
  WHERE c.conrelid = 'public.chat_attachments'::regclass
    AND c.confrelid = 'public.profiles'::regclass
    AND c.contype = 'f'
    AND array_length(c.conkey, 1) = 1
    AND a.attname = 'receiver_id'
    AND ref_a.attname = 'id'
    AND c.confdeltype = 'c'
    AND c.convalidated = true
  ORDER BY (c.conname = 'chat_attachments_receiver_id_fkey') DESC
  LIMIT 1;

  IF v_existing_fk_name IS NOT NULL THEN
    RAISE NOTICE 'Verified existing validated foreign key on receiver_id: %', v_existing_fk_name;
    -- Deduplicate: Drop any redundant equivalent foreign keys on receiver_id pointing to public.profiles(id)
    FOR r IN (
      SELECT c.conname
      FROM pg_constraint c
      JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = c.conkey[1]
      JOIN pg_attribute ref_a ON ref_a.attrelid = c.confrelid AND ref_a.attnum = c.confkey[1]
      WHERE c.conrelid = 'public.chat_attachments'::regclass
        AND c.confrelid = 'public.profiles'::regclass
        AND c.contype = 'f'
        AND array_length(c.conkey, 1) = 1
        AND a.attname = 'receiver_id'
        AND ref_a.attname = 'id'
        AND c.conname <> v_existing_fk_name
    ) LOOP
      EXECUTE format('ALTER TABLE public.chat_attachments DROP CONSTRAINT %I', r.conname);
      RAISE NOTICE 'Dropped redundant duplicate foreign key on receiver_id: %', r.conname;
    END LOOP;
  ELSE
    ALTER TABLE public.chat_attachments DROP CONSTRAINT IF EXISTS chat_attachments_receiver_id_fkey;
    ALTER TABLE public.chat_attachments
      ADD CONSTRAINT chat_attachments_receiver_id_fkey
      FOREIGN KEY (receiver_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    -- Deduplicate: Drop any other stale/unvalidated foreign keys on receiver_id
    FOR r IN (
      SELECT c.conname
      FROM pg_constraint c
      JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = c.conkey[1]
      JOIN pg_attribute ref_a ON ref_a.attrelid = c.confrelid AND ref_a.attnum = c.confkey[1]
      WHERE c.conrelid = 'public.chat_attachments'::regclass
        AND c.confrelid = 'public.profiles'::regclass
        AND c.contype = 'f'
        AND array_length(c.conkey, 1) = 1
        AND a.attname = 'receiver_id'
        AND ref_a.attname = 'id'
        AND c.conname <> 'chat_attachments_receiver_id_fkey'
    ) LOOP
      EXECUTE format('ALTER TABLE public.chat_attachments DROP CONSTRAINT %I', r.conname);
      RAISE NOTICE 'Dropped stale foreign key on receiver_id: %', r.conname;
    END LOOP;
  END IF;

  -- 3. Verify check constraint: no self-attachment (sender_id <> receiver_id)
  -- Matches attribute dependencies (sender_id and receiver_id) and inequality operator (<> or !=)
  SELECT c.conname INTO v_self_conname
  FROM pg_constraint c
  WHERE c.conrelid = 'public.chat_attachments'::regclass
    AND c.contype = 'c'
    AND c.convalidated = true
    AND c.conkey @> ARRAY[v_sender_attnum, v_receiver_attnum]
    AND array_length(c.conkey, 1) = 2
    AND (
      pg_get_constraintdef(c.oid) ~* 'sender_id\s*(<>|!=)\s*receiver_id'
      OR pg_get_constraintdef(c.oid) ~* 'receiver_id\s*(<>|!=)\s*sender_id'
    )
  ORDER BY (c.conname = 'no_self_attachment') DESC
  LIMIT 1;

  IF v_self_conname IS NOT NULL THEN
    RAISE NOTICE 'Verified existing validated check constraint for non-self attachment: %', v_self_conname;
    -- Drop any duplicate check constraints referencing sender_id and receiver_id inequality under other names
    FOR r IN (
      SELECT c.conname
      FROM pg_constraint c
      WHERE c.conrelid = 'public.chat_attachments'::regclass
        AND c.contype = 'c'
        AND c.conkey @> ARRAY[v_sender_attnum, v_receiver_attnum]
        AND array_length(c.conkey, 1) = 2
        AND c.conname <> v_self_conname
        AND (
          pg_get_constraintdef(c.oid) ~* 'sender_id\s*(<>|!=)\s*receiver_id'
          OR pg_get_constraintdef(c.oid) ~* 'receiver_id\s*(<>|!=)\s*sender_id'
        )
    ) LOOP
      EXECUTE format('ALTER TABLE public.chat_attachments DROP CONSTRAINT %I', r.conname);
      RAISE NOTICE 'Dropped duplicate check constraint: %', r.conname;
    END LOOP;
  ELSE
    ALTER TABLE public.chat_attachments DROP CONSTRAINT IF EXISTS no_self_attachment;
    ALTER TABLE public.chat_attachments
      ADD CONSTRAINT no_self_attachment CHECK (sender_id <> receiver_id);
    RAISE NOTICE 'Added canonical check constraint: no_self_attachment';
  END IF;

  -- 4. Verify check constraint: valid storage path (storage_path LIKE sender_id || '/%')
  -- In PostgreSQL, LIKE decompiles to the ~~ operator: ((storage_path ~~ ((sender_id)::text || '/%'::text)))
  -- Matches semantic column dependencies (conkey contains storage_path and sender_id) and prefix expression.
  -- Rejects any constraint that does not strictly enforce storage_path LIKE (sender_id::text || '/%').
  SELECT c.conname INTO v_path_conname
  FROM pg_constraint c
  WHERE c.conrelid = 'public.chat_attachments'::regclass
    AND c.contype = 'c'
    AND c.convalidated = true
    AND c.conkey @> ARRAY[v_path_attnum, v_sender_attnum]
    AND array_length(c.conkey, 1) = 2
    AND pg_get_constraintdef(c.oid) ~* '^\s*CHECK\s*\(\s*\(?\s*\(?\s*storage_path\s*\)?(?:::text)?\s*\)?\s*(~~|like)\s*\(?\s*\(?\s*\(?\s*sender_id\s*\)?::text\s*\|\|\s*''/%''(?:::text)?\s*\)?\s*\)?\s*\)\s*$'
  ORDER BY (c.conname = 'valid_storage_path') DESC
  LIMIT 1;

  IF v_path_conname IS NOT NULL THEN
    RAISE NOTICE 'Verified existing validated check constraint for storage path: %', v_path_conname;
    -- Drop any duplicate check constraints referencing storage_path and sender_id prefix under other names
    FOR r IN (
      SELECT c.conname
      FROM pg_constraint c
      WHERE c.conrelid = 'public.chat_attachments'::regclass
        AND c.contype = 'c'
        AND c.conkey @> ARRAY[v_path_attnum, v_sender_attnum]
        AND array_length(c.conkey, 1) = 2
        AND c.conname <> v_path_conname
        AND pg_get_constraintdef(c.oid) ~* '^\s*CHECK\s*\(\s*\(?\s*\(?\s*storage_path\s*\)?(?:::text)?\s*\)?\s*(~~|like)\s*\(?\s*\(?\s*\(?\s*sender_id\s*\)?::text\s*\|\|\s*''/%''(?:::text)?\s*\)?\s*\)?\s*\)\s*$'
    ) LOOP
      EXECUTE format('ALTER TABLE public.chat_attachments DROP CONSTRAINT %I', r.conname);
      RAISE NOTICE 'Dropped duplicate check constraint: %', r.conname;
    END LOOP;
  ELSE
    ALTER TABLE public.chat_attachments DROP CONSTRAINT IF EXISTS valid_storage_path;
    ALTER TABLE public.chat_attachments
      ADD CONSTRAINT valid_storage_path CHECK (storage_path LIKE (sender_id::text || '/%'));
    RAISE NOTICE 'Added canonical check constraint: valid_storage_path';
  END IF;
END $$;


-- ------------------------------------------------------------------------------
-- STEP 1.5: High-Performance Indexes for Fast Signed URL & Participant Lookups
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_chat_attachments_path ON public.chat_attachments(storage_path);
CREATE INDEX IF NOT EXISTS idx_chat_attachments_sender ON public.chat_attachments(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_attachments_receiver ON public.chat_attachments(receiver_id);
CREATE INDEX IF NOT EXISTS idx_chat_attachments_pair ON public.chat_attachments(sender_id, receiver_id);
CREATE INDEX IF NOT EXISTS idx_chat_attachments_conversation ON public.chat_attachments(conversation_id);


-- ------------------------------------------------------------------------------
-- STEP 1.6: Audit & Reset Row Level Security Policies on public.chat_attachments
-- Drop all existing policies on this table so no permissive legacy policy lingers
-- to bypass INSERT path restrictions or SELECT recipient restrictions.
-- Unrelated database tables and policies are completely preserved.
-- ------------------------------------------------------------------------------
ALTER TABLE public.chat_attachments ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN (
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'chat_attachments'
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.chat_attachments', pol.policyname);
  END LOOP;
END $$;

-- 1.6.1 Metadata Policy: SELECT
-- Strictly limited to the sender and recipient of the attachment.
CREATE POLICY "chat_attachments_metadata_select_policy"
ON public.chat_attachments
FOR SELECT
TO authenticated
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- 1.6.2 Metadata Policy: INSERT
-- Enforces sender authenticity, non-self recipient, and sender folder path prefix.
-- Recipient existence in public.profiles is guaranteed at engine level by the validated foreign key.
CREATE POLICY "chat_attachments_metadata_insert_policy"
ON public.chat_attachments
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = sender_id
  AND receiver_id <> auth.uid()
  AND storage_path LIKE (auth.uid()::text || '/%')
);

-- 1.6.3 Metadata Policy: DELETE
-- Strictly limited to original uploader.
CREATE POLICY "chat_attachments_metadata_delete_policy"
ON public.chat_attachments
FOR DELETE
TO authenticated
USING (auth.uid() = sender_id);


-- ------------------------------------------------------------------------------
-- STEP 2: Audit & Drop All Known Conflicting / Legacy Storage Policies
-- We explicitly target only policies that grant access to 'chat-attachments',
-- including joint policies that covered both 'chat-attachments' and 'voice-messages'.
-- We do NOT drop policies belonging strictly to unrelated buckets (e.g. 'avatars', 'supabucket').
-- ------------------------------------------------------------------------------
-- Drop legacy INSERT policies targeting chat-attachments
DROP POLICY IF EXISTS "Authenticated learners can upload to chat-attachments" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload to chat-attachments" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload chat attachments" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload attachments" ON storage.objects; -- Joint legacy policy
DROP POLICY IF EXISTS "chat_attachments_insert_policy" ON storage.objects;

-- Drop legacy SELECT policies (especially overly-permissive ones)
DROP POLICY IF EXISTS "Authorized participants can view chat-attachments" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can read chat-attachments" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can access chat attachments" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can access attachments" ON storage.objects; -- Joint legacy policy
DROP POLICY IF EXISTS "chat_attachments_select_policy" ON storage.objects;

-- Drop legacy UPDATE policies
DROP POLICY IF EXISTS "Senders can update only their own chat-attachments" ON storage.objects;
DROP POLICY IF EXISTS "Senders can update their own chat-attachments" ON storage.objects;
DROP POLICY IF EXISTS "chat_attachments_update_policy" ON storage.objects;

-- Drop legacy DELETE policies
DROP POLICY IF EXISTS "Senders can delete only their own chat-attachments" ON storage.objects;
DROP POLICY IF EXISTS "Senders can delete their own chat-attachments" ON storage.objects;
DROP POLICY IF EXISTS "chat_attachments_delete_policy" ON storage.objects;


-- ------------------------------------------------------------------------------
-- STEP 3: Create Hardened Storage Policies for 'chat-attachments'
-- Strictly scoped to 'chat-attachments' bucket.
-- ------------------------------------------------------------------------------

-- 3.1. Policy: INSERT (Upload)
-- Enforces path convention: <auth.uid()>/<timestamp>_<random>_<filename>
-- Senders can ONLY write into their own folder.
CREATE POLICY "chat_attachments_insert_policy"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'chat-attachments'
  AND (
    name LIKE (auth.uid()::text || '/%')
    OR (storage.foldername(name))[1] = auth.uid()::text
  )
);

-- 3.2. Policy: SELECT (Read / Download / Generate Signed URL)
-- Strictly limited to:
-- 1. Original uploader (verified via path prefix, folder name, or owner)
-- 2. Verified recipient designated by the uploader in public.chat_attachments metadata
--    (ca.storage_path = name AND ca.receiver_id = auth.uid() AND ca.sender_id matches folder).
-- (Does NOT reference non-existent chat_messages or unrelated ai_chat_messages).
-- All other authenticated users and public requests are STRICTLY DENIED.
CREATE POLICY "chat_attachments_select_policy"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'chat-attachments'
  AND (
    -- Condition 1: Original uploader can always access their own files
    name LIKE (auth.uid()::text || '/%')
    OR (storage.foldername(name))[1] = auth.uid()::text
    OR owner::text = auth.uid()::text

    -- Condition 2: Verified recipient designated in public.chat_attachments metadata
    OR EXISTS (
      SELECT 1 FROM public.chat_attachments ca
      WHERE ca.storage_path = storage.objects.name
        AND ca.receiver_id = auth.uid()
        AND ca.sender_id::text = (storage.foldername(storage.objects.name))[1]
    )
  )
);

-- 3.3. Policy: UPDATE (Modify / Overwrite)
-- Strictly limited to original uploader.
CREATE POLICY "chat_attachments_update_policy"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'chat-attachments'
  AND (
    name LIKE (auth.uid()::text || '/%')
    OR (storage.foldername(name))[1] = auth.uid()::text
    OR owner::text = auth.uid()::text
  )
)
WITH CHECK (
  bucket_id = 'chat-attachments'
  AND (
    name LIKE (auth.uid()::text || '/%')
    OR (storage.foldername(name))[1] = auth.uid()::text
    OR owner::text = auth.uid()::text
  )
);

-- 3.4. Policy: DELETE (Remove)
-- Strictly limited to original uploader.
CREATE POLICY "chat_attachments_delete_policy"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'chat-attachments'
  AND (
    name LIKE (auth.uid()::text || '/%')
    OR (storage.foldername(name))[1] = auth.uid()::text
    OR owner::text = auth.uid()::text
  )
);


-- ------------------------------------------------------------------------------
-- STEP 4: Table Grants for PostgREST
-- Schema usage is already granted to 'authenticated' by Supabase default configuration.
-- ------------------------------------------------------------------------------
GRANT SELECT, INSERT, DELETE ON public.chat_attachments TO authenticated;

COMMIT;
