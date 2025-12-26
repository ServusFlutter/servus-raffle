-- Seed file for TEST INSTANCE
-- This file is run on test instance start and reset
-- Contains predictable data for integration tests

-- Test users (created with known UUIDs for assertions)
-- Note: These are inserted into public.users, but auth.users must be created separately
-- The test setup will handle auth user creation via Supabase Auth API

-- Known test UUIDs (use these in test assertions)
-- Test Admin:     11111111-1111-1111-1111-111111111111
-- Test User 1:    22222222-2222-2222-2222-222222222222
-- Test User 2:    33333333-3333-3333-3333-333333333333
-- Test Raffle 1:  aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa
-- Test Raffle 2:  bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb

-- Create test raffle (owned by test admin - will be linked after auth user creation)
INSERT INTO raffles (id, name, status, qr_code_expires_at, created_at)
VALUES
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'Test Active Raffle',
    'active',
    NOW() + INTERVAL '2 hours',
    NOW() - INTERVAL '1 hour'
  ),
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'Test Draft Raffle',
    'draft',
    NULL,
    NOW() - INTERVAL '2 hours'
  ),
  (
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    'Test Completed Raffle',
    'completed',
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '2 days'
  )
ON CONFLICT (id) DO NOTHING;

-- Note: participants and winners records are created dynamically in tests
-- to ensure proper auth.uid() references
