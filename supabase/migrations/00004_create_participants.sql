-- Migration: Create participants table
-- Description: Creates the participants table for tracking users who join raffles with RLS policies
-- Story: 3-1 QR Code Join Flow & Participant Registration

-- Create participants table
-- Tracks which users have joined which raffles and their ticket count
CREATE TABLE IF NOT EXISTS participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  raffle_id uuid NOT NULL REFERENCES raffles(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ticket_count int DEFAULT 1 NOT NULL,
  joined_at timestamptz DEFAULT now() NOT NULL,
  -- Prevent duplicate registrations (AC #4)
  UNIQUE(raffle_id, user_id)
);

-- Create indexes for efficient queries
-- Index for user queries (e.g., "what raffles am I in?")
CREATE INDEX idx_participants_user_id ON participants(user_id);
-- Index for raffle queries (e.g., "who is in this raffle?")
CREATE INDEX idx_participants_raffle_id ON participants(raffle_id);

-- Enable Row Level Security
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;

-- Policy: Service role has full access (for Server Actions)
-- Required for joinRaffle server action to insert/update records
CREATE POLICY "Service role full access" ON participants
  FOR ALL
  USING (auth.role() = 'service_role');

-- Policy: Users can read their own participation records
-- Allows users to see their own tickets across raffles
CREATE POLICY "Users can read own participants" ON participants
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can read all participants in raffles they're part of
-- Allows seeing other participants in a raffle (for participant list in later stories)
CREATE POLICY "Participants can read raffle participants" ON participants
  FOR SELECT
  USING (
    raffle_id IN (
      SELECT raffle_id FROM participants WHERE user_id = auth.uid()
    )
  );
