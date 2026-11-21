-- ==============================================================================
-- LearnLync: Voice Messaging, Video Meetings & WebRTC Signaling Migration
-- Execute this script in your Supabase Project -> SQL Editor
-- ==============================================================================

-- 1. Create Meeting Rooms Table
create table if not exists public.meeting_rooms (
  id uuid default gen_random_uuid() primary key,
  code text unique not null,
  title text not null,
  host_id uuid references public.profiles(id) on delete cascade not null,
  is_active boolean default true not null,
  created_at timestamptz default now() not null,
  ended_at timestamptz
);

-- Performance index on room code
create index if not exists idx_meeting_rooms_code on public.meeting_rooms(code);
create index if not exists idx_meeting_rooms_host on public.meeting_rooms(host_id);

-- 2. Create Meeting Participants Table
create table if not exists public.meeting_participants (
  id uuid default gen_random_uuid() primary key,
  room_id uuid references public.meeting_rooms(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  role text default 'participant' not null,
  joined_at timestamptz default now() not null,
  left_at timestamptz,
  constraint valid_role check (role in ('host', 'co-host', 'participant'))
);

create index if not exists idx_meeting_participants_room on public.meeting_participants(room_id);
create index if not exists idx_meeting_participants_user on public.meeting_participants(user_id);

-- 3. Create Meeting Messages Table (In-Meeting Live Chat)
create table if not exists public.meeting_messages (
  id uuid default gen_random_uuid() primary key,
  room_id uuid references public.meeting_rooms(id) on delete cascade not null,
  sender_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  created_at timestamptz default now() not null,
  constraint content_not_empty check (char_length(trim(content)) between 1 and 2000)
);

create index if not exists idx_meeting_messages_room on public.meeting_messages(room_id, created_at);

-- 4. Enable Row Level Security (RLS)
alter table public.meeting_rooms enable row level security;
alter table public.meeting_participants enable row level security;
alter table public.meeting_messages enable row level security;

-- 5. RLS Policies: meeting_rooms
drop policy if exists "Authenticated users can view active meeting rooms" on public.meeting_rooms;
create policy "Authenticated users can view active meeting rooms"
  on public.meeting_rooms for select
  to authenticated
  using (true);

drop policy if exists "Authenticated users can create meeting rooms" on public.meeting_rooms;
create policy "Authenticated users can create meeting rooms"
  on public.meeting_rooms for insert
  to authenticated
  with check (auth.uid() = host_id);

drop policy if exists "Hosts can update their own meeting rooms" on public.meeting_rooms;
create policy "Hosts can update their own meeting rooms"
  on public.meeting_rooms for update
  to authenticated
  using (auth.uid() = host_id)
  with check (auth.uid() = host_id);

-- 6. RLS Policies: meeting_participants
drop policy if exists "Authenticated users can view meeting participants" on public.meeting_participants;
create policy "Authenticated users can view meeting participants"
  on public.meeting_participants for select
  to authenticated
  using (true);

drop policy if exists "Authenticated users can join meeting rooms" on public.meeting_participants;
create policy "Authenticated users can join meeting rooms"
  on public.meeting_participants for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own participant record" on public.meeting_participants;
create policy "Users can update their own participant record"
  on public.meeting_participants for update
  to authenticated
  using (auth.uid() = user_id);

-- 7. RLS Policies: meeting_messages
drop policy if exists "Meeting participants can view room messages" on public.meeting_messages;
create policy "Meeting participants can view room messages"
  on public.meeting_messages for select
  to authenticated
  using (true);

drop policy if exists "Authenticated users can post meeting messages" on public.meeting_messages;
create policy "Authenticated users can post meeting messages"
  on public.meeting_messages for insert
  to authenticated
  with check (auth.uid() = sender_id);

-- 8. Supabase Storage Bucket for Voice Messages
insert into storage.buckets (id, name, public)
values ('voice-messages', 'voice-messages', true)
on conflict (id) do nothing;

-- 9. Storage Bucket RLS Policies
drop policy if exists "Authenticated learners can upload voice messages" on storage.objects;
create policy "Authenticated learners can upload voice messages"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'voice-messages' and
    (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Anyone authenticated can access voice messages" on storage.objects;
create policy "Anyone authenticated can access voice messages"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'voice-messages');

-- 10. Table Grants for PostgREST
grant usage on schema public to authenticated;
grant select, insert, update on public.meeting_rooms to authenticated;
grant select, insert, update on public.meeting_participants to authenticated;
grant select, insert on public.meeting_messages to authenticated;
