-- Create users table
-- This table extends auth.users with Meetup-specific profile data
CREATE TABLE users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  meetup_id text UNIQUE NOT NULL,
  name text,
  avatar_url text,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own record
CREATE POLICY "Users can read own record" ON users
  FOR SELECT
  USING (auth.uid() = id);

-- Policy: Service role can insert/update (for OAuth callback processing)
CREATE POLICY "Service role full access" ON users
  FOR ALL
  USING (auth.role() = 'service_role');

-- Create index on meetup_id for faster lookups
CREATE INDEX idx_users_meetup_id ON users(meetup_id);

-- Add comment for documentation
COMMENT ON TABLE users IS 'Stores Meetup user profile data synced during OAuth authentication';
COMMENT ON COLUMN users.meetup_id IS 'Unique identifier from Meetup.com, used to prevent duplicate accounts';
COMMENT ON COLUMN users.avatar_url IS 'URL to user profile photo from Meetup.com';
