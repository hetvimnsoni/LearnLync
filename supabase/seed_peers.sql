-- ==============================================================================
-- LearnLync: Sample Peer Learners Seed Script (Optional for Local Testing)
-- Execute this script in your Supabase Project -> SQL Editor
-- ==============================================================================
-- This script creates 4 realistic learner accounts in auth.users and public.profiles
-- so that you can immediately test Peer Discovery and Nexconn Identity Mapping.

DO $$
DECLARE
  u1_id uuid := '11111111-1111-1111-1111-111111111111';
  u2_id uuid := '22222222-2222-2222-2222-222222222222';
  u3_id uuid := '33333333-3333-3333-3333-333333333333';
  u4_id uuid := '44444444-4444-4444-4444-444444444444';
BEGIN
  -- Insert dummy auth users if they do not exist
  INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud)
  VALUES
    (u1_id, '00000000-0000-0000-0000-000000000000', 'elena@learnlync.dev', '$2a$10$abcdefghijklmnopqrstuvwxyzABCDEF', now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Elena Rostova"}', now(), now(), 'authenticated', 'authenticated'),
    (u2_id, '00000000-0000-0000-0000-000000000000', 'marcus@learnlync.dev', '$2a$10$abcdefghijklmnopqrstuvwxyzABCDEF', now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Marcus Chen"}', now(), now(), 'authenticated', 'authenticated'),
    (u3_id, '00000000-0000-0000-0000-000000000000', 'priya@learnlync.dev', '$2a$10$abcdefghijklmnopqrstuvwxyzABCDEF', now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Priya Sharma"}', now(), now(), 'authenticated', 'authenticated'),
    (u4_id, '00000000-0000-0000-0000-000000000000', 'alex@learnlync.dev', '$2a$10$abcdefghijklmnopqrstuvwxyzABCDEF', now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Alex Rivera"}', now(), now(), 'authenticated', 'authenticated')
  ON CONFLICT (id) DO NOTHING;

  -- Upsert rich learner profiles
  INSERT INTO public.profiles (id, email, full_name, username, bio, skills_offered, skills_needed)
  VALUES
    (
      u1_id,
      'elena@learnlync.dev',
      'Elena Rostova',
      'elena_ml',
      'AI/ML research engineer passionate about LLMs, PyTorch, and NLP. Looking to sharpen my frontend and modern React skills in exchange for machine learning tutoring.',
      ARRAY['Python', 'PyTorch', 'Machine Learning', 'FastAPI'],
      ARRAY['React', 'Next.js', 'Tailwind CSS']
    ),
    (
      u2_id,
      'marcus@learnlync.dev',
      'Marcus Chen',
      'marcus_frontend',
      'Senior design engineer with 5+ years building accessible, lightning-fast design systems. Eager to master cloud infrastructure and container orchestration.',
      ARRAY['React', 'TypeScript', 'Tailwind CSS', 'UI/UX Design'],
      ARRAY['Docker', 'Kubernetes', 'AWS']
    ),
    (
      u3_id,
      'priya@learnlync.dev',
      'Priya Sharma',
      'priya_devops',
      'DevOps and Cloud architect specializing in CI/CD automation, Terraform, and cloud-native Kubernetes clusters. Wanting to learn Rust and systems programming.',
      ARRAY['Docker', 'Kubernetes', 'AWS', 'Terraform', 'CI/CD'],
      ARRAY['Rust', 'Go', 'System Architecture']
    ),
    (
      u4_id,
      'alex@learnlync.dev',
      'Alex Rivera',
      'alex_fullstack',
      'Fullstack engineer enthusiastic about GraphQL APIs, PostgreSQL optimization, and high-throughput microservices. Keen to collaborate on AI agent projects.',
      ARRAY['Node.js', 'PostgreSQL', 'GraphQL', 'TypeScript'],
      ARRAY['Machine Learning', 'Python', 'LangChain']
    )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    username = EXCLUDED.username,
    bio = EXCLUDED.bio,
    skills_offered = EXCLUDED.skills_offered,
    skills_needed = EXCLUDED.skills_needed;
END $$;

