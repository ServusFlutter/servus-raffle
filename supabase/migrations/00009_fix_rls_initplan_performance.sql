-- Migration: Fix RLS policy performance issues (initplan optimization)
-- Date: 2025-12-26
-- Issue: auth.uid() and auth.role() not wrapped in (SELECT ...) causes per-row evaluation
-- Fix: Wrap in (SELECT ...) to enable per-query caching (initplan optimization)
--
-- Affected policies:
--   users: "Users can read own record", "Users can update own record",
--          "Service role full access", "Users can insert own record"
--   raffles: "Service role full access", "Users can read own raffles"
--   participants: "Service role full access", "Users can read own participants"
--   winners: "Service role full access", "Users can read own wins"

-- ============================================================
-- FIX: users table policies
-- ============================================================

DROP POLICY IF EXISTS "Users can read own record" ON users;
CREATE POLICY "Users can read own record" ON users
  FOR SELECT
  USING ((SELECT auth.uid()) = id);

DROP POLICY IF EXISTS "Users can update own record" ON users;
CREATE POLICY "Users can update own record" ON users
  FOR UPDATE
  USING ((SELECT auth.uid()) = id);

DROP POLICY IF EXISTS "Service role full access" ON users;
CREATE POLICY "Service role full access" ON users
  FOR ALL
  USING ((SELECT auth.role()) = 'service_role');

DROP POLICY IF EXISTS "Users can insert own record" ON users;
CREATE POLICY "Users can insert own record" ON users
  FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = id);

-- ============================================================
-- FIX: raffles table policies
-- ============================================================

DROP POLICY IF EXISTS "Service role full access" ON raffles;
CREATE POLICY "Service role full access" ON raffles
  FOR ALL
  USING ((SELECT auth.role()) = 'service_role');

DROP POLICY IF EXISTS "Users can read own raffles" ON raffles;
CREATE POLICY "Users can read own raffles" ON raffles
  FOR SELECT
  USING ((SELECT auth.uid()) = created_by);

-- Note: "Anyone can read active raffles" policy uses (status = 'active'), no auth function

-- ============================================================
-- FIX: participants table policies
-- ============================================================

DROP POLICY IF EXISTS "Service role full access" ON participants;
CREATE POLICY "Service role full access" ON participants
  FOR ALL
  USING ((SELECT auth.role()) = 'service_role');

DROP POLICY IF EXISTS "Users can read own participants" ON participants;
CREATE POLICY "Users can read own participants" ON participants
  FOR SELECT
  USING ((SELECT auth.uid()) = user_id);

-- Note: "Participants can read raffle participants" uses is_participant_in_raffle() function

-- ============================================================
-- FIX: winners table policies
-- ============================================================

DROP POLICY IF EXISTS "Service role full access" ON winners;
CREATE POLICY "Service role full access" ON winners
  FOR ALL
  USING ((SELECT auth.role()) = 'service_role');

DROP POLICY IF EXISTS "Users can read own wins" ON winners;
CREATE POLICY "Users can read own wins" ON winners
  FOR SELECT
  USING ((SELECT auth.uid()) = user_id);

-- Note: "Authenticated users can read winners" uses is_authenticated() function

-- ============================================================
-- DOCUMENTATION
-- ============================================================

COMMENT ON POLICY "Users can read own record" ON users IS
  'Users can view their own profile. Uses (SELECT auth.uid()) for initplan optimization.';

COMMENT ON POLICY "Users can update own record" ON users IS
  'Users can update their own profile. Uses (SELECT auth.uid()) for initplan optimization.';

COMMENT ON POLICY "Service role full access" ON users IS
  'Service role has full access for admin operations. Uses (SELECT auth.role()) for initplan optimization.';

COMMENT ON POLICY "Users can insert own record" ON users IS
  'Users can create their own profile during registration. Uses (SELECT auth.uid()) for initplan optimization.';
