-- Migration: Create winners table
-- Description: Creates the winners table for tracking raffle winners and ticket reset for accumulation
-- Story: 3-3 Ticket Accumulation Across Events
-- Note: prize_id is nullable until Epic 4 creates the prizes table

-- Create winners table
-- Tracks which users have won in which raffles for exclusion in ticket accumulation
CREATE TABLE IF NOT EXISTS winners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  raffle_id uuid NOT NULL REFERENCES raffles(id) ON DELETE CASCADE,
  prize_id uuid,  -- Nullable until Epic 4 creates prizes table
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tickets_at_win int NOT NULL,
  won_at timestamptz DEFAULT now() NOT NULL
);

-- Indexes for efficient queries
-- Index for user queries (e.g., "when did this user last win?" for accumulation calculation)
CREATE INDEX idx_winners_user_id ON winners(user_id);
-- Index for raffle queries (e.g., "who won in this raffle?")
CREATE INDEX idx_winners_raffle_id ON winners(raffle_id);
-- Composite index for efficient "last win" queries used in ticket accumulation
CREATE INDEX idx_winners_user_won_at ON winners(user_id, won_at DESC);

-- Enable Row Level Security
ALTER TABLE winners ENABLE ROW LEVEL SECURITY;

-- Policy: Service role has full access (for Server Actions like drawWinner)
CREATE POLICY "Service role full access" ON winners
  FOR ALL
  USING (auth.role() = 'service_role');

-- Policy: Users can read their own wins
CREATE POLICY "Users can read own wins" ON winners
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Public can read winner announcements (for winner displays/history)
CREATE POLICY "Public can read winner announcements" ON winners
  FOR SELECT
  USING (true);
