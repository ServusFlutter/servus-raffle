-- Migration: Fix recursive RLS policy on participants table
-- Description: The "Participants can read raffle participants" policy caused infinite recursion
-- Issue: Policy queries participants table while checking access to participants table

-- Drop the problematic recursive policy
DROP POLICY IF EXISTS "Participants can read raffle participants" ON participants;

-- Create a security definer function to check if user is a participant
-- This function bypasses RLS, breaking the recursion cycle
CREATE OR REPLACE FUNCTION is_participant_in_raffle(check_raffle_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM participants
    WHERE raffle_id = check_raffle_id
    AND user_id = auth.uid()
  );
$$;

-- Recreate the policy using the security definer function
-- This allows participants to see other participants in their raffle
CREATE POLICY "Participants can read raffle participants" ON participants
  FOR SELECT
  USING (is_participant_in_raffle(raffle_id));
