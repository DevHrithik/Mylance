# Google OAuth Setup for Mylance

## 1. Google Cloud Console Setup

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API and Google OAuth2 API

### Step 2: Configure OAuth Consent Screen

1. Go to "APIs & Services" > "OAuth consent screen"
2. Choose "External" user type
3. Fill in the following:
   - App name: **Mylance**
   - User support email: **your-email@domain.com**
   - App domain: **mylance.netlify.app** (or your domain)
   - Developer contact: **your-email@domain.com**
4. Add scopes:
   - `email`
   - `profile`
   - `openid`
5. Save and continue

### Step 3: Create OAuth Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "+ CREATE CREDENTIALS" > "OAuth 2.0 Client IDs"
3. Choose "Web application"
4. Configure:

   - Name: **Mylance Web Client**
   - Authorized JavaScript origins:
     - `http://localhost:3000` (for development)
     - `https://mylance.netlify.app` (your production domain)
   - Authorized redirect URIs:
     - `http://localhost:3000/callback` (for development)
     - `https://mylance.netlify.app/callback` (your production domain)
     - `https://vdnwvbskzitbnygdtldm.supabase.co/auth/v1/callback` (Supabase OAuth callback)

5. Save and copy the **Client ID** and **Client Secret**

## 2. Supabase Configuration

### Step 1: Add Google Provider in Supabase Dashboard

1. Go to your Supabase project: [My Lance](https://supabase.com/dashboard/project/vdnwvbskzitbnygdtldm)
2. Navigate to "Authentication" > "Providers"
3. Find "Google" and toggle it ON
4. Fill in:
   - **Client ID**: Your Google OAuth Client ID
   - **Client Secret**: Your Google OAuth Client Secret
   - **Redirect URL**: Should be pre-filled as `https://vdnwvbskzitbnygdtldm.supabase.co/auth/v1/callback`

### Step 2: Update Site URL Configuration

1. Go to "Authentication" > "URL Configuration"
2. Set **Site URL** to:
   - Development: `http://localhost:3000`
   - Production: `https://mylance.netlify.app`
3. Add **Redirect URLs** (one per line):
   ```
   http://localhost:3000/callback
   https://mylance.netlify.app/callback
   ```

### Step 3: Enable PKCE (Important for OAuth Security)

1. In "Authentication" > "Settings"
2. Ensure **"Enable PKCE flow"** is enabled
3. This is required for secure OAuth flows

## 3. Environment Variables

Make sure your `.env.local` file has:

```env
NEXT_PUBLIC_SUPABASE_URL=https://vdnwvbskzitbnygdtldm.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## 4. Database Schema Update

If you don't have a trigger to create user profiles on signup, add this to your Supabase SQL editor:

```sql
-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, created_at, updated_at)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', new.email),
    new.created_at,
    new.updated_at
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

## 5. Testing

1. Start your development server:

   ```bash
   bun dev
   ```

2. Navigate to `/login` or `/signup`
3. Click "Sign in with Google" button
4. Complete Google OAuth flow
5. Should redirect to dashboard or onboarding

## Troubleshooting

### PKCE Flow Issues:

1. **"both auth code and code verifier should be non-empty" error**
   - Ensure Google Console has correct redirect URIs
   - Verify Supabase redirect URLs match your app URLs
   - Check that PKCE is enabled in Supabase settings
   - Make sure you're using `/callback` (not `/auth/callback`) as your app redirect

### Common Issues:

1. **Redirect URI mismatch**

   - Ensure all redirect URIs match exactly in Google Console and Supabase
   - Use `/callback` (not `/auth/callback`) for your app redirects
   - Check for trailing slashes

2. **Invalid client error**

   - Verify Client ID and Secret are correctly entered in Supabase
   - Check OAuth consent screen is configured

3. **CORS errors**

   - Ensure JavaScript origins are set in Google Console
   - Verify Site URL is configured in Supabase

4. **Profile creation fails**
   - Check if the trigger function exists and is working
   - Verify profiles table schema

### Debug Steps:

1. Check browser console for errors
2. Check Supabase logs in dashboard
3. Verify Google OAuth credentials
4. Test with different browsers/incognito mode
5. Verify PKCE is enabled in Supabase

## Production Deployment

When deploying to production:

1. Update Google Console with production domain
2. Update Supabase Site URL to production domain
3. Add production redirect URLs: `https://mylance.netlify.app/callback`
4. Update environment variables in Netlify
5. Ensure PKCE flow is enabled

### Critical Configuration Summary:

- **Google Console Redirect URIs:**

  - `https://mylance.netlify.app/callback` (your app)
  - `https://vdnwvbskzitbnygdtldm.supabase.co/auth/v1/callback` (Supabase)

- **Supabase Redirect URLs:**

  - `https://mylance.netlify.app/callback`

- **Code Configuration:**
  - `redirectTo: ${window.location.origin}/callback`

Your Google OAuth is now properly configured with PKCE security! 🎉
