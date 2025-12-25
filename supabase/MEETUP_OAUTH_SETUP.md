# Meetup OAuth Configuration Guide

This guide walks through setting up Meetup.com OAuth authentication with Supabase.

## Prerequisites

- A Meetup.com account
- Access to Meetup Pro (or ability to create an OAuth consumer)
- A Supabase project

## Step 1: Register OAuth Application on Meetup

1. Go to [Meetup OAuth Consumers](https://www.meetup.com/api/oauth/list/)
2. Click "Create New OAuth Consumer"
3. Fill in the application details:
   - **Name**: Servus Raffle (or your app name)
   - **Application Website**: Your production URL
   - **Redirect URI**: `{SUPABASE_URL}/auth/v1/callback`
     - Example: `https://abcdefghijk.supabase.co/auth/v1/callback`
   - **Description**: Raffle system for meetup events
4. Save and note your **Client ID** and **Client Secret**

## Step 2: Configure Supabase Authentication

### Option A: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** > **Providers**
3. Since Meetup is not a built-in provider, we'll use a custom OAuth provider:

**Important Note**: Supabase doesn't have built-in Meetup OAuth support. We'll need to implement a custom OAuth flow.

### Option B: Custom OAuth Implementation

Since Meetup isn't a native Supabase provider, we'll implement the OAuth flow manually:

#### Meetup OAuth 2.0 Endpoints

- **Authorization URL**: `https://secure.meetup.com/oauth2/authorize`
- **Token URL**: `https://secure.meetup.com/oauth2/access`
- **User Info URL**: `https://api.meetup.com/gql` (GraphQL endpoint)
- **Scopes**: `basic` (provides profile information)

#### Required Environment Variables

Add these to your `.env.local`:

```env
MEETUP_CLIENT_ID=your_client_id_from_meetup
MEETUP_CLIENT_SECRET=your_client_secret_from_meetup
```

## Step 3: OAuth Flow Implementation

The OAuth flow works as follows:

1. **User clicks "Sign in with Meetup"**
   - Redirect to `https://secure.meetup.com/oauth2/authorize?client_id={CLIENT_ID}&response_type=code&redirect_uri={CALLBACK_URL}`

2. **User authorizes on Meetup**
   - Meetup redirects back with authorization code

3. **Exchange code for access token**
   - POST to `https://secure.meetup.com/oauth2/access`
   - Body: `client_id`, `client_secret`, `grant_type=authorization_code`, `redirect_uri`, `code`

4. **Fetch user profile**
   - Query Meetup GraphQL API with access token:
   ```graphql
   query {
     self {
       id
       name
       photo {
         baseUrl
       }
     }
   }
   ```

5. **Create/update user in Supabase**
   - Create user in `auth.users` (if not exists)
   - Upsert profile in `users` table

## Step 4: Testing

1. Ensure environment variables are set
2. Navigate to `/login`
3. Click "Sign in with Meetup"
4. Authorize on Meetup
5. Verify redirect back to app
6. Check that user record is created in database

## Troubleshooting

### "Redirect URI mismatch"
- Ensure the redirect URI in Meetup OAuth settings exactly matches your callback URL
- Format: `{SUPABASE_URL}/auth/v1/callback` or `{APP_URL}/auth/callback` if using custom implementation

### "Invalid client credentials"
- Verify `MEETUP_CLIENT_ID` and `MEETUP_CLIENT_SECRET` are correct
- Ensure no extra whitespace in environment variables

### "Unauthorized"
- Check that `basic` scope is included in authorization request
- Verify access token is being sent in Authorization header

## Security Notes

- **NEVER** commit `.env.local` to version control
- **NEVER** expose `MEETUP_CLIENT_SECRET` to the client
- All token exchanges must happen server-side
- Use HTTPS in production

## References

- [Meetup OAuth Documentation](https://www.meetup.com/meetup_api/auth/)
- [Meetup GraphQL API](https://www.meetup.com/meetup_api/docs/gql/)
- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
