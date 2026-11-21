-- ==============================================================================
-- LearnLync: Advanced Chat Management & File-Sharing Schema
-- Execute this script in your Supabase Project -> SQL Editor
-- ==============================================================================

-- 1. Create chat_hidden_conversations table (User-specific soft delete / "Delete for Me")
create table if not exists public.chat_hidden_conversations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  peer_id uuid references public.profiles(id) on delete cascade not null,
  hidden_at timestamptz default now() not null,
  unique (user_id, peer_id),
  constraint no_self_hidden_chat check (user_id <> peer_id)
);

-- Indexes for lightning-fast lookups when loading conversations
create index if not exists idx_chat_hidden_user on public.chat_hidden_conversations(user_id);
create index if not exists idx_chat_hidden_user_peer on public.chat_hidden_conversations(user_id, peer_id);

-- 2. Create chat_attachments table (Audit and metadata for all media/documents)
create table if not exists public.chat_attachments (
  id uuid default gen_random_uuid() primary key,
  sender_id uuid references public.profiles(id) on delete cascade not null,
  receiver_id uuid references public.profiles(id) on delete cascade not null,
  file_name text not null,
  file_type text not null,
  file_size bigint not null,
  storage_path text not null,
  public_url text not null,
  created_at timestamptz default now() not null,
  constraint no_self_attachment check (sender_id <> receiver_id)
);

create index if not exists idx_chat_attachments_sender on public.chat_attachments(sender_id);
create index if not exists idx_chat_attachments_receiver on public.chat_attachments(receiver_id);
create index if not exists idx_chat_attachments_pair on public.chat_attachments(sender_id, receiver_id);

-- 3. Enable Row Level Security (RLS)
alter table public.chat_hidden_conversations enable row level security;
alter table public.chat_attachments enable row level security;

-- 4. RLS Policies: chat_hidden_conversations
drop policy if exists "Users can view their own hidden conversations" on public.chat_hidden_conversations;
create policy "Users can view their own hidden conversations"
  on public.chat_hidden_conversations for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can hide conversations for themselves" on public.chat_hidden_conversations;
create policy "Users can hide conversations for themselves"
  on public.chat_hidden_conversations for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can unhide their own conversations" on public.chat_hidden_conversations;
create policy "Users can unhide their own conversations"
  on public.chat_hidden_conversations for delete
  to authenticated
  using (auth.uid() = user_id);

-- 5. RLS Policies: chat_attachments
drop policy if exists "Users can view attachments in their conversations" on public.chat_attachments;
create policy "Users can view attachments in their conversations"
  on public.chat_attachments for select
  to authenticated
  using (auth.uid() = sender_id or auth.uid() = receiver_id);

drop policy if exists "Users can insert attachment metadata" on public.chat_attachments;
create policy "Users can insert attachment metadata"
  on public.chat_attachments for insert
  to authenticated
  with check (auth.uid() = sender_id);

-- 6. Supabase Storage Bucket for Chat Attachments
insert into storage.buckets (id, name, public)
values ('chat-attachments', 'chat-attachments', true)
on conflict (id) do nothing;

-- 7. Storage Bucket RLS Policies
drop policy if exists "Authenticated users can upload chat attachments" on storage.objects;
create policy "Authenticated users can upload chat attachments"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'chat-attachments' and
    (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Authenticated users can access chat attachments" on storage.objects;
create policy "Authenticated users can access chat attachments"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'chat-attachments');

-- 8. Table Grants for PostgREST
grant usage on schema public to authenticated;
grant select, insert, delete on public.chat_hidden_conversations to authenticated;
grant select, insert on public.chat_attachments to authenticated;
