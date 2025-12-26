-- Migration: Fix function search_path security issue
-- Date: 2025-12-26
-- Issue: Functions without explicit search_path are vulnerable to search_path injection
-- Fix: Set search_path = '' and use fully qualified table names

-- ============================================================
-- FIX: is_participant_in_raffle function
-- ============================================================

-- Must drop the dependent policy first
DROP POLICY IF EXISTS "Participants can read raffle participants" ON participants;

-- Drop and recreate function with secure search_path
DROP FUNCTION IF EXISTS is_participant_in_raffle(uuid);

CREATE FUNCTION is_participant_in_raffle(check_raffle_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.participants
    WHERE raffle_id = check_raffle_id
    AND user_id = auth.uid()
  );
$$;

COMMENT ON FUNCTION is_participant_in_raffle(uuid) IS
  'Checks if current user is a participant in the given raffle. Uses SECURITY DEFINER to bypass RLS for the check.';

-- Recreate the policy using the updated function
CREATE POLICY "Participants can read raffle participants" ON participants
  FOR SELECT
  USING (is_participant_in_raffle(raffle_id));

-- ============================================================
-- FIX: is_authenticated function
-- ============================================================

-- Drop the dependent policy first
DROP POLICY IF EXISTS "Authenticated users can read winners" ON winners;

-- Drop and recreate function with secure search_path
DROP FUNCTION IF EXISTS is_authenticated();

CREATE FUNCTION is_authenticated()
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = ''
AS $$
  SELECT auth.uid() IS NOT NULL;
$$;

COMMENT ON FUNCTION is_authenticated() IS
  'Returns true if the current request has an authenticated user.';

-- Recreate the policy using the updated function
CREATE POLICY "Authenticated users can read winners" ON winners
  FOR SELECT
  USING (
    is_authenticated()
    AND EXISTS (
      SELECT 1 FROM public.raffles
      WHERE public.raffles.id = winners.raffle_id
      AND public.raffles.status = 'completed'
    )
  );
