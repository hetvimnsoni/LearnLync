-- ==============================================================================
-- LearnLync: Fix Schema Cache & Permissions for scheduled_meetings
-- Run this script in your Supabase Project -> SQL Editor
-- ==============================================================================

-- 1. Grant schema usage and table privileges to Supabase API roles
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.scheduled_meetings TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- 2. Ensure Row Level Security (RLS) is enabled with working policies
ALTER TABLE public.scheduled_meetings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated read" ON public.scheduled_meetings;
CREATE POLICY "Allow authenticated read" ON public.scheduled_meetings
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow anon read" ON public.scheduled_meetings;
CREATE POLICY "Allow anon read" ON public.scheduled_meetings
  FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Allow authenticated insert" ON public.scheduled_meetings;
CREATE POLICY "Allow authenticated insert" ON public.scheduled_meetings
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Allow owner update" ON public.scheduled_meetings;
CREATE POLICY "Allow owner update" ON public.scheduled_meetings
  FOR UPDATE TO authenticated USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Allow owner delete" ON public.scheduled_meetings;
CREATE POLICY "Allow owner delete" ON public.scheduled_meetings
  FOR DELETE TO authenticated USING (auth.uid() = owner_id);

-- 3. CRITICAL: Force PostgREST to reload its in-memory schema cache immediately
NOTIFY pgrst, 'reload schema';
