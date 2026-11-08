-- ==============================================================================
-- LearnLync Stage 6: Skill Exchanges & Connection Requests Migration
-- Concurrency-Safe Reciprocal Detection & Strict Authorization Triggers
-- ==============================================================================

-- 1. Create the skill_exchanges table
create table if not exists public.skill_exchanges (
  id uuid default gen_random_uuid() primary key,
  sender_id uuid references public.profiles(id) on delete cascade not null,
  receiver_id uuid references public.profiles(id) on delete cascade not null,
  skill_offered text not null,
  skill_wanted text not null,
  message text default '',
  status text default 'pending' not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,

  -- Constraints
  constraint no_self_exchange 
    check (sender_id <> receiver_id),
  constraint valid_status 
    check (status in ('pending', 'accepted', 'rejected', 'cancelled')),
  constraint skill_offered_not_empty 
    check (char_length(trim(skill_offered)) between 1 and 80),
  constraint skill_wanted_not_empty 
    check (char_length(trim(skill_wanted)) between 1 and 80),
  constraint message_length_limit 
    check (char_length(coalesce(message, '')) <= 1000)
);

-- 2. Performance & Query Indexes
create index if not exists idx_skill_exchanges_sender 
  on public.skill_exchanges (sender_id);

create index if not exists idx_skill_exchanges_receiver 
  on public.skill_exchanges (receiver_id);

create index if not exists idx_skill_exchanges_receiver_status 
  on public.skill_exchanges (receiver_id, status);

create index if not exists idx_skill_exchanges_sender_status 
  on public.skill_exchanges (sender_id, status);

-- 3. Unique Partial Index: Same-direction duplicate prevention
create unique index if not exists unique_pending_exchange_same_dir
  on public.skill_exchanges (
    sender_id,
    receiver_id,
    lower(trim(skill_offered)),
    lower(trim(skill_wanted))
  )
  where status = 'pending';

-- 4. Concurrency-Safe Reciprocal Duplicate Detection Trigger
create or replace function public.check_reciprocal_pending_exchange()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  u1 text;
  u2 text;
begin
  -- Normalize skills and message
  new.skill_offered := trim(new.skill_offered);
  new.skill_wanted := trim(new.skill_wanted);
  new.message := coalesce(trim(new.message), '');

  -- Derive deterministic, ordered participant identifiers (independent of sender/receiver order)
  u1 := least(new.sender_id, new.receiver_id)::text;
  u2 := greatest(new.sender_id, new.receiver_id)::text;

  -- CONCURRENCY SAFEGUARD:
  -- Acquire an exclusive transaction-level advisory lock on the unordered pair (u1, u2).
  -- If another transaction is simultaneously inserting an exchange between the same pair,
  -- it will serialize here until this transaction commits or aborts.
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtext(u1),
    pg_catalog.hashtext(u2)
  );

  -- Post-lock existence check: executed with visibility of all transactions committed before this statement
  if exists (
    select 1 from public.skill_exchanges
    where status = 'pending'
      and sender_id = new.receiver_id
      and receiver_id = new.sender_id
      and lower(skill_offered) = lower(new.skill_wanted)
      and lower(skill_wanted) = lower(new.skill_offered)
  ) then
    raise exception 'A pending exchange request between these learners for these reciprocal skills already exists. Please check your incoming requests to accept it.';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_check_reciprocal_pending_exchange on public.skill_exchanges;
create trigger trg_check_reciprocal_pending_exchange
  before insert on public.skill_exchanges
  for each row execute function public.check_reciprocal_pending_exchange();

-- 5. Trigger: Strict Authorization, Immutable Fields & Status Transition Rules
create or replace function public.enforce_skill_exchange_update_rules()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  caller_id uuid := auth.uid();
begin
  -- A. Strict Authorization: Reject unauthenticated callers immediately
  if caller_id is null then
    raise exception 'Authentication required: caller is not signed in';
  end if;

  -- B. Enforce immutable fields: sender, receiver, skills, message, created_at, and id cannot change
  if new.id <> old.id then
    raise exception 'Field "id" is immutable and cannot be modified';
  end if;

  if new.sender_id <> old.sender_id then
    raise exception 'Field "sender_id" is immutable and cannot be modified';
  end if;

  if new.receiver_id <> old.receiver_id then
    raise exception 'Field "receiver_id" is immutable and cannot be modified';
  end if;

  if new.skill_offered <> old.skill_offered then
    raise exception 'Field "skill_offered" is immutable and cannot be modified';
  end if;

  if new.skill_wanted <> old.skill_wanted then
    raise exception 'Field "skill_wanted" is immutable and cannot be modified';
  end if;

  if coalesce(new.message, '') <> coalesce(old.message, '') then
    raise exception 'Field "message" is immutable and cannot be modified';
  end if;

  if new.created_at <> old.created_at then
    raise exception 'Field "created_at" is immutable and cannot be modified';
  end if;

  -- C. Prevent updating closed or terminal requests
  if old.status <> 'pending' then
    raise exception 'Cannot modify a closed exchange request (current status: %)', old.status;
  end if;

  -- D. Enforce strict status transitions and exact caller authorization
  if new.status in ('accepted', 'rejected') then
    -- Only the receiver can accept or reject
    if caller_id <> old.receiver_id then
      raise exception 'Only the receiver can accept or reject an exchange request';
    end if;
  elsif new.status = 'cancelled' then
    -- Only the sender can cancel
    if caller_id <> old.sender_id then
      raise exception 'Only the sender can cancel their exchange request';
    end if;
  else
    raise exception 'Invalid status transition: pending -> %', new.status;
  end if;

  -- E. Automatically update the updated_at timestamp to current time
  new.updated_at := now();

  return new;
end;
$$;

drop trigger if exists trg_enforce_skill_exchange_rules on public.skill_exchanges;
create trigger trg_enforce_skill_exchange_rules
  before update on public.skill_exchanges
  for each row execute function public.enforce_skill_exchange_update_rules();

-- 6. Enable Row Level Security (RLS)
alter table public.skill_exchanges enable row level security;

-- 7. RLS Policies
-- Policy 1: Participants can view requests involving themselves
drop policy if exists "Participants can view their exchange requests" on public.skill_exchanges;
create policy "Participants can view their exchange requests"
  on public.skill_exchanges
  for select
  to authenticated
  using (
    auth.uid() = sender_id or auth.uid() = receiver_id
  );

-- Policy 2: Authenticated users can insert requests where sender_id matches their session
drop policy if exists "Authenticated users can create exchange requests" on public.skill_exchanges;
create policy "Authenticated users can create exchange requests"
  on public.skill_exchanges
  for insert
  to authenticated
  with check (
    auth.uid() = sender_id and sender_id <> receiver_id
  );

-- Policy 3: Update permission gated by participant role and status
drop policy if exists "Participants can update their exchange requests" on public.skill_exchanges;
create policy "Participants can update their exchange requests"
  on public.skill_exchanges
  for update
  to authenticated
  using (
    (auth.uid() = receiver_id and status = 'pending') or
    (auth.uid() = sender_id and status = 'pending')
  )
  with check (
    (auth.uid() = receiver_id and status in ('accepted', 'rejected')) or
    (auth.uid() = sender_id and status = 'cancelled')
  );

-- 8. Table Grants for Supabase Data API (PostgREST)
grant usage on schema public to authenticated;
grant select, insert, update on public.skill_exchanges to authenticated;
grant all on public.skill_exchanges to service_role;

