-- Migration: Consolidate multiple permissive RLS policies
-- Date: 2025-12-26
-- Issue: Supabase lint 0006 - Multiple permissive policies for same role/action
-- Reference: https://supabase.com/docs/guides/database/database-advisors?lint=0006_multiple_permissive_policies
--
-- Problem: Multiple permissive policies are combined with OR by Postgres,
-- adding overhead for each policy evaluation. Better to use a single policy
-- with explicit OR conditions.
--
-- Affected tables:
--   - raffles: 2 SELECT policies → 1 combined policy
--   - participants: 2 SELECT policies → 1 combined policy
--   - winners: 2 SELECT policies → 1 combined policy

-- ============================================================
-- FIX: raffles table - combine SELECT policies
-- ============================================================
-- Current policies:
--   1. "Users can read own raffles" - USING (auth.uid() = created_by)
--   2. "Anyone can read active raffles" - USING (status = 'active')

DROP POLICY IF EXISTS "Users can read own raffles" ON raffles;
DROP POLICY IF EXISTS "Anyone can read active raffles" ON raffles;

-- Combined policy: Users can read raffles they created OR that are active
CREATE POLICY "Users can read raffles" ON raffles
  FOR SELECT
  USING (
    (SELECT auth.uid()) = created_by  -- own raffles
    OR
    status = 'active'  -- active raffles (for participants)
  );

COMMENT ON POLICY "Users can read raffles" ON raffles IS
  'Combined policy: users can read their own raffles or any active raffle. Consolidated from 2 policies for lint 0006 compliance.';

-- ============================================================
-- FIX: participants table - combine SELECT policies
-- ============================================================
-- Current policies:
--   1. "Users can read own participants" - USING (auth.uid() = user_id)
--   2. "Participants can read raffle participants" - USING (is_participant_in_raffle(raffle_id))

DROP POLICY IF EXISTS "Users can read own participants" ON participants;
DROP POLICY IF EXISTS "Participants can read raffle participants" ON participants;

-- Update helper function to use initplan optimization
CREATE OR REPLACE FUNCTION is_participant_in_raffle(check_raffle_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM participants
    WHERE raffle_id = check_raffle_id
    AND user_id = (SELECT auth.uid())  -- initplan optimization
  );
$$;

-- Combined policy: Users can read their own records OR records in raffles they're part of
CREATE POLICY "Users can read participants" ON participants
  FOR SELECT
  USING (
    (SELECT auth.uid()) = user_id  -- own participation records
    OR
    is_participant_in_raffle(raffle_id)  -- other participants in same raffle
  );

COMMENT ON POLICY "Users can read participants" ON participants IS
  'Combined policy: users can read their own participation or other participants in raffles they joined. Consolidated from 2 policies for lint 0006 compliance.';

-- ============================================================
-- FIX: winners table - combine SELECT policies
-- ============================================================
-- Current policies:
--   1. "Users can read own wins" - USING (auth.uid() = user_id)
--   2. "Authenticated users can read winners" - USING (is_authenticated() AND raffle is completed)

DROP POLICY IF EXISTS "Users can read own wins" ON winners;
DROP POLICY IF EXISTS "Authenticated users can read winners" ON winners;

-- Update helper function to use initplan optimization
CREATE OR REPLACE FUNCTION is_authenticated()
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT (SELECT auth.uid()) IS NOT NULL;  -- initplan optimization
$$;

-- Combined policy: Users can read their own wins OR winners from completed raffles
CREATE POLICY "Users can read winners" ON winners
  FOR SELECT
  USING (
    (SELECT auth.uid()) = user_id  -- own wins
    OR
    (
      is_authenticated()  -- must be logged in
      AND EXISTS (
        SELECT 1 FROM raffles
        WHERE raffles.id = winners.raffle_id
        AND raffles.status = 'completed'
      )
    )
  );

COMMENT ON POLICY "Users can read winners" ON winners IS
  'Combined policy: users can read their own wins or winners from completed raffles. Consolidated from 2 policies for lint 0006 compliance.';

-- ============================================================
-- DOCUMENTATION
-- ============================================================

COMMENT ON FUNCTION is_participant_in_raffle(uuid) IS
  'Security definer function to check raffle participation without RLS recursion. Uses initplan optimization.';

COMMENT ON FUNCTION is_authenticated() IS
  'Helper function to check if user is authenticated. Uses initplan optimization.';
