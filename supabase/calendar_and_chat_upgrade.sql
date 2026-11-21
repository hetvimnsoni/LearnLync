-- ==============================================================================
-- LearnLync: Calendar, Scheduled Meetings & Individual Message Deletion Migration
-- Execute this script in your Supabase Project -> SQL Editor
-- ==============================================================================

-- 1. Create scheduled_meetings table
create table if not exists public.scheduled_meetings (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  meeting_date date not null,
  start_time text not null, -- e.g. "14:00"
  end_time text not null,   -- e.g. "15:00"
  owner_id uuid references public.profiles(id) on delete cascade not null,
  room_code text not null,
  meeting_link text not null,
  meeting_type text default 'study_group' not null,
  status text default 'upcoming' not null, -- 'upcoming', 'completed', 'cancelled'
  invited_participant_ids uuid[] default '{}'::uuid[],
  reminder_minutes integer default 15,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  constraint valid_meeting_status check (status in ('upcoming', 'completed', 'cancelled'))
);

create index if not exists idx_scheduled_meetings_date on public.scheduled_meetings(meeting_date);
create index if not exists idx_scheduled_meetings_owner on public.scheduled_meetings(owner_id);
create index if not exists idx_scheduled_meetings_status on public.scheduled_meetings(status);

-- 2. Create chat_messages table (for tracking persistence & Delete for Everyone)
create table if not exists public.chat_messages (
  id text primary key,
  sender_id uuid references public.profiles(id) on delete cascade not null,
  receiver_id uuid references public.profiles(id) on delete cascade not null,
  text text not null,
  is_deleted_for_everyone boolean default false not null,
  deleted_at timestamptz,
  created_at timestamptz default now() not null
);

create index if not exists idx_chat_messages_pair on public.chat_messages(sender_id, receiver_id);

-- 3. Create chat_message_deletions table (for user-specific "Delete for Me")
create table if not exists public.chat_message_deletions (
  id uuid default gen_random_uuid() primary key,
  message_id text not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  deleted_at timestamptz default now() not null,
  unique (message_id, user_id)
);

create index if not exists idx_chat_msg_del_user on public.chat_message_deletions(user_id);
create index if not exists idx_chat_msg_del_msg on public.chat_message_deletions(message_id);

-- 4. Enable Row Level Security (RLS)
alter table public.scheduled_meetings enable row level security;
alter table public.chat_messages enable row level security;
alter table public.chat_message_deletions enable row level security;

-- 5. RLS Policies: scheduled_meetings
drop policy if exists "Authenticated users can view scheduled meetings" on public.scheduled_meetings;
create policy "Authenticated users can view scheduled meetings"
  on public.scheduled_meetings for select
  to authenticated
  using (true);

drop policy if exists "Users can create their own scheduled meetings" on public.scheduled_meetings;
create policy "Users can create their own scheduled meetings"
  on public.scheduled_meetings for insert
  to authenticated
  with check (auth.uid() = owner_id);

drop policy if exists "Owners can update their scheduled meetings" on public.scheduled_meetings;
create policy "Owners can update their scheduled meetings"
  on public.scheduled_meetings for update
  to authenticated
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

drop policy if exists "Owners can delete their scheduled meetings" on public.scheduled_meetings;
create policy "Owners can delete their scheduled meetings"
  on public.scheduled_meetings for delete
  to authenticated
  using (auth.uid() = owner_id);

-- 6. RLS Policies: chat_messages
drop policy if exists "Participants can view their chat messages" on public.chat_messages;
create policy "Participants can view their chat messages"
  on public.chat_messages for select
  to authenticated
  using (auth.uid() = sender_id or auth.uid() = receiver_id);

drop policy if exists "Users can insert their chat messages" on public.chat_messages;
create policy "Users can insert their chat messages"
  on public.chat_messages for insert
  to authenticated
  with check (auth.uid() = sender_id);

drop policy if exists "Senders can mark messages deleted for everyone" on public.chat_messages;
create policy "Senders can mark messages deleted for everyone"
  on public.chat_messages for update
  to authenticated
  using (auth.uid() = sender_id)
  with check (auth.uid() = sender_id);

-- 7. RLS Policies: chat_message_deletions
drop policy if exists "Users can view their own message deletions" on public.chat_message_deletions;
create policy "Users can view their own message deletions"
  on public.chat_message_deletions for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can delete messages for themselves" on public.chat_message_deletions;
create policy "Users can delete messages for themselves"
  on public.chat_message_deletions for insert
  to authenticated
  with check (auth.uid() = user_id);

-- 8. Storage bucket for chat attachments with safe policies
insert into storage.buckets (id, name, public)
values ('chat-attachments', 'chat-attachments', true)
on conflict (id) do nothing;

drop policy if exists "Authenticated users can upload attachments" on storage.objects;
create policy "Authenticated users can upload attachments"
  on storage.objects for insert
  to authenticated
  with check (bucket_id in ('chat-attachments', 'voice-messages'));

drop policy if exists "Authenticated users can access attachments" on storage.objects;
create policy "Authenticated users can access attachments"
  on storage.objects for select
  to authenticated
  using (bucket_id in ('chat-attachments', 'voice-messages'));

-- 9. Table Grants for PostgREST
grant usage on schema public to authenticated;
grant select, insert, update, delete on public.scheduled_meetings to authenticated;
grant select, insert, update on public.chat_messages to authenticated;
grant select, insert on public.chat_message_deletions to authenticated;
