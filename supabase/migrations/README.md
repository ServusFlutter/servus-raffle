# Database Migrations

This directory contains SQL migration files for the Supabase database.

## Applying Migrations

### Option 1: Using Supabase Dashboard (Recommended for hosted projects)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy the contents of the migration file
4. Paste and execute the SQL

### Option 2: Using Supabase CLI (Local development)

If you have Supabase running locally:

```bash
# Initialize Supabase (if not already done)
supabase init

# Start local Supabase
supabase start

# Migrations are automatically applied when starting
# Or manually apply with:
supabase db reset
```

### Option 3: Manual SQL Execution

Connect to your database and execute the migration files in order:

```bash
psql -h your-project.supabase.co -U postgres -d postgres -f supabase/migrations/00001_create_users.sql
```

## Migration Files

- `00001_create_users.sql` - Creates the users table with RLS policies for Meetup OAuth authentication
