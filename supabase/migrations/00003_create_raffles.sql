-- Migration: Create raffles table
-- Description: Creates the raffles table for storing raffle events with RLS policies

-- Create raffles table
CREATE TABLE IF NOT EXISTS raffles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  status text DEFAULT 'draft' NOT NULL CHECK (status IN ('draft', 'active', 'drawing', 'completed')),
  qr_code_expires_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  created_by uuid REFERENCES users(id)
);

-- Create index on created_by for efficient admin queries
CREATE INDEX idx_raffles_created_by ON raffles(created_by);

-- Enable Row Level Security
ALTER TABLE raffles ENABLE ROW LEVEL SECURITY;

-- Policy: Service role has full access (for admin server actions)
CREATE POLICY "Service role full access" ON raffles
  FOR ALL
  USING (auth.role() = 'service_role');

-- Policy: Authenticated users can read their own created raffles
CREATE POLICY "Users can read own raffles" ON raffles
  FOR SELECT
  USING (auth.uid() = created_by);

-- Policy: Anyone authenticated can read active raffles (for participants)
CREATE POLICY "Anyone can read active raffles" ON raffles
  FOR SELECT
  USING (status = 'active');
