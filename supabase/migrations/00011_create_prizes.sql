-- Migration: Create prizes table for raffle prize management
-- Date: 2025-12-26
-- Story: 4.1 - Add Prizes to Raffle
-- Reference: architecture.md Database Schema

-- ============================================================
-- CREATE PRIZES TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS prizes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  raffle_id uuid NOT NULL REFERENCES raffles(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  sort_order int NOT NULL DEFAULT 0,
  awarded_to uuid REFERENCES users(id),
  awarded_at timestamptz
);

-- Index for efficient queries by raffle
CREATE INDEX idx_prizes_raffle_id ON prizes(raffle_id);

-- ============================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE prizes ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS POLICIES
-- ============================================================
-- Following consolidated policy pattern from 00010_consolidate_permissive_policies.sql
-- ONE policy per operation per role - combine conditions with OR
-- ALWAYS wrap auth.uid() in (SELECT ...) for initplan optimization

-- Service role has full access (for admin server actions)
CREATE POLICY "Service role full access" ON prizes
  FOR ALL
  USING ((SELECT auth.role()) = 'service_role');

-- Authenticated users can read prizes for raffles they can see
-- Users can see prizes for:
--   1. Active raffles (participants can see what prizes are available)
--   2. Raffles they created (admin can see their own draft/completed raffles)
CREATE POLICY "Users can read prizes" ON prizes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM raffles r
      WHERE r.id = prizes.raffle_id
      AND (
        r.status = 'active'  -- active raffles visible to all
        OR r.created_by = (SELECT auth.uid())  -- creator can see all their raffles
      )
    )
  );

-- ============================================================
-- DOCUMENTATION
-- ============================================================

COMMENT ON TABLE prizes IS
  'Prizes that can be won in a raffle. Each prize belongs to one raffle and can be awarded to one winner.';

COMMENT ON COLUMN prizes.id IS 'Unique identifier for the prize';
COMMENT ON COLUMN prizes.raffle_id IS 'Reference to the raffle this prize belongs to';
COMMENT ON COLUMN prizes.name IS 'Display name of the prize (required)';
COMMENT ON COLUMN prizes.description IS 'Optional detailed description of the prize';
COMMENT ON COLUMN prizes.sort_order IS 'Order in which prizes are drawn (0 = first)';
COMMENT ON COLUMN prizes.awarded_to IS 'User who won this prize (null if not yet awarded)';
COMMENT ON COLUMN prizes.awarded_at IS 'Timestamp when the prize was awarded';

COMMENT ON POLICY "Service role full access" ON prizes IS
  'Allows service role (used by Server Actions) to perform all operations on prizes.';

COMMENT ON POLICY "Users can read prizes" ON prizes IS
  'Allows authenticated users to read prizes for active raffles or raffles they created.';
