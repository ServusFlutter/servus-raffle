-- Migration: Pivot from Meetup OAuth to Email/Password authentication
-- This migration transforms the users table from meetup_id to email-based identification

-- Drop Meetup-specific index
DROP INDEX IF EXISTS idx_users_meetup_id;

-- Drop Meetup-specific column
ALTER TABLE users DROP COLUMN IF EXISTS meetup_id;

-- Add email column (will be populated from auth.users on insert)
-- Using NOT NULL constraint - new users will always have email
ALTER TABLE users ADD COLUMN IF NOT EXISTS email text;

-- Make email unique and not null (in separate statement for existing data compatibility)
-- First update any existing rows that might have null email (edge case)
UPDATE users SET email = (
  SELECT email FROM auth.users WHERE auth.users.id = users.id
) WHERE email IS NULL;

-- Add constraints
ALTER TABLE users ALTER COLUMN email SET NOT NULL;

-- Create unique index for email
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Ensure name column has NOT NULL constraint (required field for registration)
-- First update any null names to empty string (edge case for existing data)
UPDATE users SET name = '' WHERE name IS NULL;
ALTER TABLE users ALTER COLUMN name SET NOT NULL;

-- Update table comment
COMMENT ON TABLE users IS 'Stores user profile data for email/password authentication';

-- Drop old column comments and add new ones
COMMENT ON COLUMN users.email IS 'User email address, unique identifier from auth.users';
COMMENT ON COLUMN users.avatar_url IS 'Optional URL to user profile photo';

-- Ensure RLS is enabled (should already be from initial migration)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them (idempotent approach)
DROP POLICY IF EXISTS "Users can read own record" ON users;
DROP POLICY IF EXISTS "Users can update own record" ON users;
DROP POLICY IF EXISTS "Service role full access" ON users;

-- Policy: Users can read their own record
CREATE POLICY "Users can read own record" ON users
  FOR SELECT
  USING (auth.uid() = id);

-- Policy: Users can update their own record
CREATE POLICY "Users can update own record" ON users
  FOR UPDATE
  USING (auth.uid() = id);

-- Policy: Service role has full access (for registration and admin operations)
CREATE POLICY "Service role full access" ON users
  FOR ALL
  USING (auth.role() = 'service_role');

-- Policy: Allow insert for authenticated users creating their own record
CREATE POLICY "Users can insert own record" ON users
  FOR INSERT
  WITH CHECK (auth.uid() = id);
