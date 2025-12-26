-- Migration: Fix security and performance issues identified in retrospective
-- Date: 2025-12-26
-- Issues addressed:
--   1. SECURITY: winners table has overly permissive RLS (USING true)
--   2. PERFORMANCE: raffles.status column missing index for RLS policy

-- ============================================================
-- SECURITY FIX: Restrict winners table read access
-- ============================================================

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Public can read winner announcements" ON winners;

-- Create helper function to check if user is authenticated
-- (Supabase auth.uid() returns null for unauthenticated requests)
CREATE OR REPLACE FUNCTION is_authenticated()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT auth.uid() IS NOT NULL;
$$;

-- Policy: Authenticated users can read winners for completed raffles
-- This supports the winner announcement display feature
CREATE POLICY "Authenticated users can read winners" ON winners
  FOR SELECT
  USING (
    is_authenticated()
    AND EXISTS (
      SELECT 1 FROM raffles
      WHERE raffles.id = winners.raffle_id
      AND raffles.status = 'completed'
    )
  );

-- Note: "Users can read own wins" policy already exists (from 00005)
-- Note: "Service role full access" policy already exists (from 00005)

-- ============================================================
-- PERFORMANCE FIX: Add index on raffles.status
-- ============================================================

-- This index improves performance for:
-- 1. RLS policy: USING (status = 'active')
-- 2. Queries filtering by status
CREATE INDEX IF NOT EXISTS idx_raffles_status ON raffles(status);

-- ============================================================
-- DOCUMENTATION
-- ============================================================

COMMENT ON POLICY "Authenticated users can read winners" ON winners IS
  'Allows authenticated users to view winners of completed raffles for winner announcements';

COMMENT ON INDEX idx_raffles_status IS
  'Performance optimization for RLS policies and status-based queries';
