# Auto-Login System for Netlify Production

This document explains the enhanced auto-login system designed specifically for Netlify production deployments.

## 🎯 Overview

The auto-login system automatically:

- Detects existing user sessions on app load
- Redirects users to appropriate dashboards (users → `/dashboard`, admins → `/admin`)
- Handles onboarding flow automatically
- Prevents Netlify CDN caching issues that cause session problems
- Provides retry logic for network issues
- Cleans up sessions properly on logout

## 🚀 Key Features

### ✅ Smart Auto-Redirects

- **Users** → `/dashboard` (if onboarding completed)
- **Admins** → `/admin` (skip onboarding)
- **New users** → `/onboarding`
- **Unauthenticated** → `/login`

### ✅ Netlify Production Optimized

- Prevents CDN caching of auth pages
- Proper cache headers for sessions
- Handles edge case scenarios
- Retry logic for temporary network issues

### ✅ Session Management

- Automatic session detection
- Proper cleanup on logout
- Storage clearing to prevent stale sessions
- Cookie management

## 📁 File Structure

```
lib/auth/
├── netlify-auto-auth.ts           # Core auto-auth logic
components/providers/
├── NetlifyAutoAuthProvider.tsx    # React provider component
hooks/
├── useAutoLogin.ts                # Hooks for easy integration
middleware.ts                      # Enhanced middleware with Netlify headers
netlify.toml                       # Netlify headers configuration
```

## 🔧 Usage

### 1. Basic Setup (Already Done)

The system is already integrated into your app layout:

```tsx
// app/layout.tsx
import { NetlifyAutoAuthProvider } from "@/components/providers/NetlifyAutoAuthProvider";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <NetlifyAutoAuthProvider
          showLoadingScreen={true}
          enableAutoRedirect={true}
        >
          {children}
        </NetlifyAutoAuthProvider>
      </body>
    </html>
  );
}
```

### 2. Page-Level Auto-Redirect

For pages that should redirect authenticated users:

```tsx
// app/page.tsx (Landing page)
import { useAutoRedirect } from "@/hooks/useAutoLogin";

export default function HomePage() {
  useAutoRedirect(); // Automatically redirects authenticated users

  return <div>Welcome to MyLance</div>;
}
```

### 3. Custom Auto-Login Logic

For more control over the auto-login behavior:

```tsx
import { useAutoLogin } from "@/hooks/useAutoLogin";

function MyComponent() {
  const {
    user,
    isAuthenticated,
    isLoading,
    isAdmin,
    login,
    logout,
    triggerAutoRedirect,
  } = useAutoLogin({
    enableAutoRedirect: true,
    redirectDelay: 500, // Optional delay in ms
    onAuthStateChange: (isAuth, user) => {
      console.log("Auth state changed:", isAuth, user);
    },
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      {isAuthenticated ? (
        <div>Welcome {user?.email}!</div>
      ) : (
        <div>Please log in</div>
      )}
    </div>
  );
}
```

### 4. Auth State Only (No Side Effects)

When you just need to read auth state without auto-redirects:

```tsx
import { useAuthState } from "@/hooks/useAutoLogin";

function ProfileComponent() {
  const { user, isAuthenticated, isAdmin } = useAuthState();

  if (!isAuthenticated) return null;

  return <div>Hello {user?.full_name}</div>;
}
```

### 5. Using the Provider Context

Access the auth system anywhere in your app:

```tsx
import { useNetlifyAutoAuth } from "@/components/providers/NetlifyAutoAuthProvider";

function AnyComponent() {
  const { user, isAuthenticated, login, logout, autoRedirect } =
    useNetlifyAutoAuth();

  const handleLogin = async () => {
    const result = await login("user@example.com", "password");
    if (result.success) {
      // User will be automatically redirected
    }
  };

  return <button onClick={handleLogin}>Login</button>;
}
```

## 🎛️ Configuration Options

### NetlifyAutoAuthProvider Props

```tsx
<NetlifyAutoAuthProvider
  showLoadingScreen={true} // Show loading screen during initial auth check
  enableAutoRedirect={true} // Enable automatic redirects
>
  {children}
</NetlifyAutoAuthProvider>
```

### useAutoLogin Options

```tsx
useAutoLogin({
  enableAutoRedirect: true, // Enable auto-redirects
  redirectDelay: 0, // Delay before redirect (ms)
  onAuthStateChange: (isAuth, user) => {
    // Callback when auth state changes
  },
});
```

## 🔄 Auto-Redirect Logic

The system follows this redirect logic:

1. **Unauthenticated users** accessing protected routes → `/login`
2. **Authenticated users** on `/login` or `/signup` → Appropriate dashboard
3. **Admins** → `/admin` (always)
4. **Users without onboarding** → `/onboarding`
5. **Users with onboarding** → `/dashboard`
6. **Root path `/`** → Redirects based on user type

## 🚨 Netlify Production Considerations

### Cache Headers

The system sets these headers to prevent caching issues:

```toml
# netlify.toml
[[headers]]
  for = "/*"
  [headers.values]
    Cache-Control = "private, no-cache, no-store, max-age=0, must-revalidate"
    Netlify-Vary = "cookie"
    X-No-Cache = "true"
```

### Middleware Enhancements

- Retry logic for profile fetching
- Netlify-specific cache headers
- Proper cookie management
- Timeout handling for slow connections

## 🐛 Debugging

### Enable Debug Logs

The system provides detailed console logs:

```javascript
// Look for these in browser console:
NetlifyAutoAuth: Starting auth check (attempt 1)
NetlifyAutoAuth: Session found, fetching profile...
NetlifyAutoAuth: User authenticated - user@example.com (admin: false)
NetlifyAutoAuth: autoRedirect called - authenticated: true, path: /
NetlifyAutoAuth: Redirecting user from root to dashboard
```

### Common Issues

1. **Session not persisting**: Check if cookies are being blocked
2. **Redirect loops**: Verify middleware config and user permissions
3. **Slow redirects**: Check network latency and retry logic
4. **Cache issues**: Verify Netlify headers are applied

## 🔧 Manual Testing

Test the auto-login system:

1. **Fresh visit**: Open app in incognito → Should show landing page
2. **Login**: Login as user → Should redirect to dashboard
3. **Refresh**: Refresh page → Should stay on dashboard (auto-login)
4. **Admin login**: Login as admin → Should redirect to admin panel
5. **Logout**: Logout → Should clear session and redirect to login

## 📊 Performance

- **Cache timeout**: 30 seconds for auth state
- **Retry attempts**: 3 attempts with exponential backoff
- **Session timeout**: 5 seconds for initial check
- **Profile retry**: 3 attempts with 500ms delay

## 🔄 Migration Notes

If upgrading from the old auth system:

1. Replace `AutoAuthProvider` with `NetlifyAutoAuthProvider`
2. Update imports to use new hooks
3. Test all auth flows in production
4. Monitor logs for any issues

## 🚀 Deployment

Deploy to Netlify:

```bash
# Deploy the updated code
git push origin main

# Netlify will automatically use the new netlify.toml headers
# No additional configuration needed
```

## 📞 Support

The auto-login system provides:

- ✅ Production-ready reliability
- ✅ Netlify CDN optimization
- ✅ Smart user flow management
- ✅ Comprehensive error handling
- ✅ Easy debugging and monitoring
