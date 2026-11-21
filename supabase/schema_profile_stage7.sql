-- ==============================================================================
-- LearnLync Stage 7: Extended User Profile Schema Migration
-- Execute this script in your Supabase Project -> SQL Editor
-- ==============================================================================

alter table public.profiles
  add column if not exists cover_url text default '',
  add column if not exists tagline text default '',
  add column if not exists pronouns text default '',
  add column if not exists date_of_birth text default '',
  add column if not exists location text default '',
  add column if not exists education text default '',
  add column if not exists profession text default '',
  add column if not exists languages text[] default '{"English"}'::text[],
  add column if not exists website text default '',
  add column if not exists social_links jsonb default '{"github":"","linkedin":"","twitter":"","discord":"","portfolio":""}'::jsonb,
  add column if not exists about_details jsonb default '{"introduction":"","background":"","passions":"","hobbies":"","personal_goals":"","career_aspirations":"","motivation":"","looking_for":""}'::jsonb,
  add column if not exists interests jsonb default '[]'::jsonb,
  add column if not exists skills_teach_detailed jsonb default '[]'::jsonb,
  add column if not exists skills_learn_detailed jsonb default '[]'::jsonb,
  add column if not exists portfolio_projects jsonb default '[]'::jsonb,
  add column if not exists achievements jsonb default '[]'::jsonb,
  add column if not exists learning_journey jsonb default '{"goals":[],"learning_hours":0,"streak_days":1,"mastered_skills":[],"upcoming_milestones":[]}'::jsonb,
  add column if not exists availability jsonb default '{"days":["Monday","Wednesday","Friday"],"time_slots":["Evening"],"timezone":"UTC","collaboration_format":["1-on-1"],"individual_or_group":"Individual","teaching_style":"Hands-on Project","languages":["English"],"open_to_exchange":true}'::jsonb,
  add column if not exists reviews jsonb default '[]'::jsonb,
  add column if not exists theme text default 'cyberpunk',
  add column if not exists privacy_settings jsonb default '{"is_public":true,"show_dob":false,"show_email":false,"show_location":true,"show_connections":true,"allow_messages":"everyone","allow_exchanges":"everyone"}'::jsonb,
  add column if not exists is_public boolean default true;

-- Ensure RLS is active on public.profiles
alter table public.profiles enable row level security;
