# 🛠️ Admin Panel Setup Guide

## Quick Setup for Testing

### Option 1: Using Dev Tools (Fastest) ⚡

**Super quick 3-step setup:**

1. **Go to Dev Tools**: Visit `/dev` for a complete setup guide
2. **Quick Auth**: Use `/dev/auth` to create account with `admin@mylance.co` + `admin123`
3. **Make Admin**: Use `/dev/admin-setup` to give admin permissions
4. **Access Panel**: Go to `/admin` to test the admin dashboard

### Option 2: Using the Development Page

1. **Create Account**: Go to `/signup` and create an account with email: `admin@mylance.co`
2. **Complete Onboarding**: Fill out the onboarding form completely
3. **Set Admin Status**: Visit `/dev/admin-setup` and click "Make Admin"
4. **Access Admin Panel**: Go to `/admin` to access the admin dashboard

### Option 3: Using Database Commands

If you have database access, you can use SQL directly:

```sql
-- First create an account normally through /signup with admin@mylance.co
-- Then run this to make them admin:
SELECT make_user_admin('admin@mylance.co');

-- Check if it worked:
SELECT * FROM check_admin_status('admin@mylance.co');
```

### Option 4: Make Any Existing User Admin

To make any existing user an admin:

```sql
-- Replace with any existing user's email
SELECT make_user_admin('user@example.com');
```

## Admin User Credentials (Development)

- **Email**: `admin@mylance.co`
- **Password**: `admin123` (for quick auth)
- **Role**: Super Admin (full permissions)

## Development Tools

### Quick Access Links

- **Dev Homepage**: `/dev` - All development tools in one place
- **Quick Auth**: `/dev/auth` - Email/password signup & login
- **Admin Setup**: `/dev/admin-setup` - Make users admin
- **Admin Panel**: `/admin` - Full admin dashboard

## Admin Panel Features

Once set up, the admin user will have access to:

- **Dashboard**: `/admin` - Overview and quick actions
- **User Management**: `/admin/users` - View and manage all users
- **Prompt Management**: `/admin/prompts` - Generate and manage AI prompts
- **Analytics**: `/admin/analytics` - Platform metrics and insights
- **Feedback**: `/admin/feedback` - User feedback management
- **Settings**: `/admin/settings` - System configuration

## Admin Permissions

The super admin role includes these permissions:

- `super_admin` - Full access to everything
- `read` / `write` / `delete` - Basic CRUD operations
- `user_read` / `user_write` / `user_delete` - User management
- `prompt_write` / `prompt_delete` - Prompt management
- `analytics_read` - View analytics
- `feedback_write` - Respond to feedback
- `impersonate` - Impersonate users for support
- `export` - Export platform data
- `system_admin` - System configuration access

## Development Utilities

### Check Admin Status

```typescript
import { checkAdminStatus } from "@/lib/admin/setup";

const status = await checkAdminStatus("admin@mylance.co");
console.log(status); // { isAdmin: true, role: 'super_admin', permissions: [...] }
```

### Make User Admin Programmatically

```typescript
import { makeUserAdmin } from "@/lib/admin/setup";

const result = await makeUserAdmin("user@example.com");
console.log(result); // { success: true, message: '...' }
```

### List All Admin Users

```typescript
import { listAdminUsers } from "@/lib/admin/setup";

const admins = await listAdminUsers();
console.log(admins); // [{ email: '...', role: '...', permissions: [...] }]
```

## Security Notes

⚠️ **Important**: This setup is for development/testing only. In production:

1. Remove the `/dev` routes completely
2. Use proper admin invitation flows
3. Implement proper authentication for admin creation
4. Add IP whitelisting for admin panel access
5. Enable audit logging for all admin actions

## Troubleshooting

### "User not found" Error

- Make sure you've created an account first (use `/dev/auth`)
- Verify the email address is correct
- Check that onboarding was completed

### "Access Denied" to Admin Panel

- Confirm the user has `is_admin = true` in the profiles table
- Verify admin_users record exists with proper permissions
- Check middleware is allowing admin routes

### Database Function Errors

- Ensure migrations have been applied
- Verify database functions exist: `make_user_admin`, `check_admin_status`
- Check Supabase RLS policies allow function execution

## Support

If you encounter issues:

1. Start with the dev tools at `/dev`
2. Check the database logs in Supabase dashboard
3. Verify all migrations were applied successfully
4. Test with the `/dev/admin-setup` page first
5. Check browser console for any JavaScript errors

---

**Happy Admin Panel Testing! 🚀**
