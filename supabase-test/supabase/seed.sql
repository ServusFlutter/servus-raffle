-- Servus Raffle - Test Seed Data
-- Contains known UUIDs for integration test assertions
-- These match the TEST_IDS in tests/integration/utils.ts

-- Insert test users into auth.users
-- Note: This requires service role access
INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change
) VALUES
  (
    '11111111-1111-1111-1111-111111111111',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'admin@test.com',
    crypt('password123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'user1@test.com',
    crypt('password123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'user2@test.com',
    crypt('password123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  )
ON CONFLICT (id) DO NOTHING;

-- Insert test profiles
INSERT INTO public.profiles (id, name) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Admin User'),
  ('22222222-2222-2222-2222-222222222222', 'Test User 1'),
  ('33333333-3333-3333-3333-333333333333', 'Test User 2')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- Insert test raffles
INSERT INTO public.raffles (id, name, status, created_by) VALUES
  ('aaaa1111-1111-1111-1111-111111111111', 'Active Raffle', 'active', '11111111-1111-1111-1111-111111111111'),
  ('bbbb2222-2222-2222-2222-222222222222', 'Draft Raffle', 'draft', '11111111-1111-1111-1111-111111111111'),
  ('cccc3333-3333-3333-3333-333333333333', 'Completed Raffle', 'completed', '11111111-1111-1111-1111-111111111111')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  status = EXCLUDED.status;

-- Insert test participants
INSERT INTO public.participants (raffle_id, user_id, ticket_count) VALUES
  ('aaaa1111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 5),
  ('aaaa1111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 3)
ON CONFLICT (raffle_id, user_id) DO UPDATE SET ticket_count = EXCLUDED.ticket_count;

-- Insert test prizes (using valid hex UUIDs - 'dddd' instead of 'pppp')
INSERT INTO public.prizes (id, raffle_id, name, sort_order) VALUES
  ('dddd1111-1111-1111-1111-111111111111', 'aaaa1111-1111-1111-1111-111111111111', 'First Prize', 1),
  ('dddd2222-2222-2222-2222-222222222222', 'aaaa1111-1111-1111-1111-111111111111', 'Second Prize', 2)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  sort_order = EXCLUDED.sort_order;
