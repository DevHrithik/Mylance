# Session Management System

## Overview

The MyLance app now uses a centralized session management system that prevents auth-related errors, random logouts, and session conflicts. This system replaces the previous fragmented approach with a single source of truth for authentication state.

## Key Components

### 1. SessionManager (`lib/auth/session-manager.ts`)

The core singleton class that manages all authentication state:

- **Single Auth Listener**: Only one auth state change listener to prevent conflicts
- **Automatic Token Refresh**: Proactive token refresh before expiration
- **Error Recovery**: Robust error handling with automatic session cleanup
- **Profile Management**: Automatic user profile loading and caching
- **Session Validation**: Validates stored session data for corruption

### 2. Enhanced Supabase Client (`lib/supabase/client.ts`)

Improved client configuration with:

- **Singleton Pattern**: Prevents multiple client instances
- **Retry Logic**: Automatic retry for transient network errors
- **Session Validation**: Pre-flight checks for corrupted session data
- **Better Error Classification**: Distinguishes between different error types

### 3. Updated Auth Hooks

- **useAuth**: Now uses SessionManager instead of managing its own state
- **useSession**: Direct access to SessionManager state (recommended for new code)

## Usage

### Basic Authentication Check

```typescript
import { useSession } from "@/hooks/useSession";

function MyComponent() {
  const { user, isAuthenticated, isLoading } = useSession();

  if (isLoading) return <div>Loading...</div>;
  if (!isAuthenticated) return <div>Please sign in</div>;

  return <div>Welcome, {user.email}!</div>;
}
```

### Admin Check

```typescript
import { useSession } from "@/hooks/useSession";

function AdminComponent() {
  const { isAdmin, profile } = useSession();

  if (!isAdmin) return <div>Access denied</div>;

  return <div>Admin panel</div>;
}
```

### Manual Session Operations

```typescript
import { useSession } from "@/hooks/useSession";

function AuthControls() {
  const { signOut, refreshSession } = useSession();

  return (
    <div>
      <button onClick={() => refreshSession()}>Refresh Session</button>
      <button onClick={() => signOut()}>Sign Out</button>
    </div>
  );
}
```

### Server-Side (Middleware, API Routes)

```typescript
// Use the existing server client for server-side operations
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // The middleware already handles session validation
  // so you can trust the user object here
}
```

## Migration Guide

### From Old AuthProvider

**Old way:**

```typescript
const { user, profile, isLoading, signOut } = useAuth();
```

**New way:**

```typescript
const { user, profile, isLoading, signOut } = useSession();
```

### From Direct Supabase Client

**Old way:**

```typescript
const supabase = createClient();
const {
  data: { user },
} = await supabase.auth.getUser();
```

**New way:**

```typescript
const { user } = useSession();
// or for async operations:
import { sessionManager } from "@/lib/auth/session-manager";
const user = sessionManager.getUser();
```

## Error Handling

The system automatically handles:

- **Expired Tokens**: Automatic refresh or cleanup
- **Corrupted Session Data**: Detection and cleanup
- **Network Errors**: Retry logic with exponential backoff
- **Race Conditions**: Single source of truth prevents conflicts

### Manual Error Recovery

If you encounter persistent session issues:

```typescript
import { sessionUtils } from "@/lib/supabase/client";

// Clear all session data
sessionUtils.clearAllSession();

// Force page reload
window.location.reload();
```

## Best Practices

1. **Use `useSession()` for new components** - provides the most up-to-date state
2. **Avoid direct Supabase client calls** - use SessionManager methods instead
3. **Don't create multiple auth listeners** - SessionManager handles this
4. **Let the system handle token refresh** - automatic scheduling prevents issues
5. **Trust the middleware** - it validates sessions before reaching your pages

## Troubleshooting

### Session Not Updating

```typescript
// Force a session refresh
const { refreshSession } = useSession();
await refreshSession();
```

### Persistent Auth Errors

```typescript
import { sessionManager } from "@/lib/auth/session-manager";

// Check current state
console.log("Auth state:", sessionManager.getState());

// Force cleanup and reinitialization
sessionManager.destroy();
window.location.reload();
```

### Profile Not Loading

```typescript
const { profile, user } = useSession();

if (user && !profile) {
  // Profile might be loading or missing
  // Check browser console for profile-related errors
}
```

## Configuration

### Session Timeouts

Edit `SESSION_CONFIG` in `lib/supabase/client.ts`:

```typescript
const SESSION_CONFIG = {
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
  MAX_SESSION_AGE: 24 * 60 * 60 * 1000, // 24 hours
};
```

### Auth Flow Type

The system uses PKCE flow by default for better security. This is configured in the Supabase client creation.

## Security Features

- **PKCE Flow**: Prevents authorization code interception
- **Automatic Token Rotation**: Reduces token replay attack surface
- **Session Validation**: Prevents corrupted session exploitation
- **Secure Cookie Handling**: Proper domain and path scoping
- **Error Boundary**: Prevents auth errors from crashing the app
