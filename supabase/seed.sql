-- Seed file for LOCAL DEVELOPMENT
-- This file is run on `supabase start` and `supabase db reset`
-- Contains sample data for manual testing

-- Note: Auth users are created via the Supabase Auth API, not directly in the database
-- Use InBucket (localhost:54324) to receive confirmation emails

-- Sample admin user for development (create via signup first, then run this)
-- INSERT INTO users (id, meetup_id, name, avatar_url)
-- VALUES (
--   'your-auth-user-id-here',
--   'dev-admin',
--   'Dev Admin',
--   null
-- );

-- Sample raffle for development
-- Uncomment after creating a user:
-- INSERT INTO raffles (id, name, status, created_by)
-- VALUES (
--   '00000000-0000-0000-0000-000000000001',
--   'December Meetup Raffle',
--   'draft',
--   'your-auth-user-id-here'
-- );

-- Development seed instructions:
-- 1. Start Supabase: npm run supabase:start
-- 2. Open Studio: http://localhost:54323
-- 3. Create a user via your app's signup flow
-- 4. Get the user ID from auth.users table
-- 5. Add user to ADMIN_EMAILS in .env.local
-- 6. Uncomment and update the INSERTs above with real IDs
-- 7. Run: npm run supabase:reset
