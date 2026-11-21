-- ==============================================================================
-- LearnLync: AI-Powered Learning Assistant Database Schema Migration
-- Safe & non-destructive extensions for roadmaps, quizzes, progress,
-- session tracking, verified certificates, and conversation context.
-- ==============================================================================

-- 1. Safely extend the public.skill_exchanges table for session completion
-- Drop previous check constraint if it exists and add updated constraint with 'completed'
alter table public.skill_exchanges 
  drop constraint if exists valid_status;

alter table public.skill_exchanges 
  add constraint valid_status 
  check (status in ('pending', 'accepted', 'rejected', 'cancelled', 'completed'));

-- Add completion tracking and session notes columns if they do not exist
alter table public.skill_exchanges 
  add column if not exists completed_at timestamptz,
  add column if not exists completed_by_sender boolean default false,
  add column if not exists completed_by_receiver boolean default false,
  add column if not exists session_notes jsonb default '{}'::jsonb;

-- 2. Create AI Chat Conversations & Messages table for persistent context
create table if not exists public.ai_chat_conversations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text default 'Learning Assistant Chat' not null,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

create table if not exists public.ai_chat_messages (
  id uuid default gen_random_uuid() primary key,
  conversation_id uuid references public.ai_chat_conversations(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

create index if not exists idx_ai_chat_messages_conv 
  on public.ai_chat_messages (conversation_id, created_at asc);

-- 3. Create Learning Roadmaps table
create table if not exists public.learning_roadmaps (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  goal text not null,
  current_level text default 'beginner' check (current_level in ('beginner', 'intermediate', 'advanced')),
  stages jsonb not null default '[]'::jsonb,
  progress_percentage integer default 0 check (progress_percentage between 0 and 100),
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

create index if not exists idx_learning_roadmaps_user 
  on public.learning_roadmaps (user_id);

-- 4. Create AI Quizzes & Attempts tables
create table if not exists public.quizzes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  topic text not null,
  difficulty text default 'beginner' check (difficulty in ('beginner', 'intermediate', 'advanced')),
  questions jsonb not null default '[]'::jsonb,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

create table if not exists public.quiz_attempts (
  id uuid default gen_random_uuid() primary key,
  quiz_id uuid references public.quizzes(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  score integer not null,
  total_questions integer not null,
  user_answers jsonb default '{}'::jsonb,
  weak_topics text[] default '{}'::text[],
  revision_suggestions text[] default '{}'::text[],
  completed_at timestamptz default timezone('utc'::text, now()) not null
);

create index if not exists idx_quiz_attempts_user 
  on public.quiz_attempts (user_id, completed_at desc);


-- 5. Create Skill Assessments table
create table if not exists public.skill_assessments (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  skill text not null,
  source text not null check (source in ('self_reported', 'quiz', 'exchange_session', 'certificate')),
  proficiency_level text default 'beginner' check (proficiency_level in ('beginner', 'intermediate', 'advanced', 'master')),
  verified boolean default false,
  score_percentage integer,
  last_assessed_at timestamptz default timezone('utc'::text, now()) not null
);

create unique index if not exists unique_user_skill_source
  on public.skill_assessments (user_id, lower(skill), source);

create index if not exists idx_skill_assessments_user
  on public.skill_assessments (user_id);

-- 6. Create Verified Certificates of Progress table
create table if not exists public.certificates (
  id text primary key, -- Deterministic unique ID like LL-2026-T-8F3A2B or LL-2026-L-4C9D1E
  exchange_id uuid references public.skill_exchanges(id) on delete cascade not null,
  type text not null check (type in ('teacher', 'learner')),
  recipient_id uuid references public.profiles(id) on delete cascade not null,
  recipient_name text not null,
  partner_id uuid references public.profiles(id) on delete cascade not null,
  partner_name text not null,
  skill text not null,
  title text not null,
  issue_date timestamptz default timezone('utc'::text, now()) not null,
  design_config jsonb not null default '{}'::jsonb,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  
  -- Ensure only ONE teacher certificate and ONE learner certificate per exchange
  constraint unique_exchange_certificate_type unique (exchange_id, type)
);

create index if not exists idx_certificates_recipient 
  on public.certificates (recipient_id);

create index if not exists idx_certificates_exchange 
  on public.certificates (exchange_id);

-- ==============================================================================
-- 7. Row Level Security (RLS) Policies
-- ==============================================================================

alter table public.ai_chat_conversations enable row level security;
alter table public.ai_chat_messages enable row level security;
alter table public.learning_roadmaps enable row level security;
alter table public.quizzes enable row level security;
alter table public.quiz_attempts enable row level security;
alter table public.skill_assessments enable row level security;
alter table public.certificates enable row level security;

-- Conversations RLS
drop policy if exists "Users can manage their own AI conversations" on public.ai_chat_conversations;
create policy "Users can manage their own AI conversations"
  on public.ai_chat_conversations for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Messages RLS
drop policy if exists "Users can manage their own AI messages" on public.ai_chat_messages;
create policy "Users can manage their own AI messages"
  on public.ai_chat_messages for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Roadmaps RLS
drop policy if exists "Users can manage their own roadmaps" on public.learning_roadmaps;
create policy "Users can manage their own roadmaps"
  on public.learning_roadmaps for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Quizzes RLS
drop policy if exists "Users can manage their own quizzes" on public.quizzes;
create policy "Users can manage their own quizzes"
  on public.quizzes for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Quiz Attempts RLS
drop policy if exists "Users can manage their own quiz attempts" on public.quiz_attempts;
create policy "Users can manage their own quiz attempts"
  on public.quiz_attempts for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Skill Assessments RLS
drop policy if exists "Users can manage their own skill assessments" on public.skill_assessments;
create policy "Users can manage their own skill assessments"
  on public.skill_assessments for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Certificates RLS: Recipient and partner can view; anyone with verified ID can view for validation
drop policy if exists "Certificates viewable by authenticated users or recipient" on public.certificates;
create policy "Certificates viewable by authenticated users or recipient"
  on public.certificates for select to authenticated
  using (true);

drop policy if exists "Certificates insertable by participants on completion" on public.certificates;
create policy "Certificates insertable by participants on completion"
  on public.certificates for insert to authenticated
  with check (auth.uid() = recipient_id or auth.uid() = partner_id);

drop policy if exists "Certificates updatable by recipient" on public.certificates;
create policy "Certificates updatable by recipient"
  on public.certificates for update to authenticated
  using (auth.uid() = recipient_id) with check (auth.uid() = recipient_id);

-- Grants
grant usage on schema public to authenticated;
grant select, insert, update, delete on public.ai_chat_conversations to authenticated;
grant select, insert, update, delete on public.ai_chat_messages to authenticated;
grant select, insert, update, delete on public.learning_roadmaps to authenticated;
grant select, insert, update, delete on public.quizzes to authenticated;
grant select, insert, update, delete on public.quiz_attempts to authenticated;
grant select, insert, update, delete on public.skill_assessments to authenticated;
grant select, insert, update on public.certificates to authenticated;
