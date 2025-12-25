# Email/Password Authentication Setup

This document describes the Supabase configuration required for email/password authentication in Servus Raffle.

## Supabase Dashboard Configuration

### 1. Enable Email Provider

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** > **Providers**
3. Find **Email** in the list
4. Ensure it is **Enabled** (toggle ON)

### 2. Disable Email Confirmation (MVP Setting)

For MVP simplicity, email confirmation is disabled so users can participate immediately:

1. Go to **Authentication** > **Email Templates**
2. Go to **Authentication** > **Settings** (or **Auth Settings**)
3. Under **Email Auth** section:
   - Set **Enable email confirmations** to **OFF**
   - This allows users to sign up and immediately use their account

**Note:** For production, you may want to enable email confirmation for security.

### 3. Configure Site URL

1. Go to **Authentication** > **URL Configuration**
2. Set **Site URL** to your application URL:
   - Development: `http://localhost:3000`
   - Production: Your production domain

### 4. Redirect URLs (Optional)

Add allowed redirect URLs if needed:
- `http://localhost:3000/**` (for development)
- `https://your-production-domain.com/**` (for production)

## Password Requirements

Supabase's default password requirements:
- Minimum 6 characters

For stronger security in production, consider:
- Minimum 8 characters (recommended)
- Mix of uppercase, lowercase, numbers

## Database Migration

Run the migration to update the users table:

```bash
supabase db push
# or
supabase migration up
```

This applies `00002_pivot_users_email_password.sql` which:
- Removes the `meetup_id` column
- Adds the `email` column with unique constraint
- Updates RLS policies for email-based authentication

## Environment Variables

Ensure these are set in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

The Meetup OAuth variables are no longer needed:
- `NEXT_PUBLIC_MEETUP_CLIENT_ID` - Remove
- `MEETUP_CLIENT_SECRET` - Remove

## Testing Authentication

1. Start the development server: `npm run dev`
2. Navigate to `/login`
3. Click "Sign Up" to create a new account
4. Enter email, password, and name
5. Upon success, you'll be redirected to `/participant`

## Troubleshooting

### "User already registered"
The email is already in use. Use the login form instead.

### "Invalid login credentials"
Check that the email and password are correct.

### "Email not confirmed"
If email confirmation is enabled, the user needs to verify their email first.

## Security Considerations

- Passwords are securely hashed by Supabase (bcrypt)
- Session tokens are stored in HTTP-only cookies
- RLS policies protect user data at the database level
- Never expose `SUPABASE_SERVICE_ROLE_KEY` to the client
