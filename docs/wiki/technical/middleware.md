# Middleware Implementation

This document details the middleware implementation in Frog Members, which handles authentication, routing, and access control throughout the application.

## Overview

The middleware (`middleware.ts`) is a critical component that:

1. Verifies user authentication status
2. Controls access to protected routes
3. Manages redirects based on user state
4. Enforces onboarding completion
5. Validates admin privileges
6. Handles special access cases

## Middleware Flow

The middleware processes each request through the following steps:

1. **Request Analysis**: Examines the requested path and search parameters
2. **Static Asset Check**: Bypasses middleware for static assets
3. **Authentication Check**: Verifies user authentication status
4. **Route Classification**: Determines if the route requires authentication
5. **Role Verification**: Checks for admin privileges if needed
6. **State Validation**: Verifies onboarding completion status
7. **Redirection**: Redirects user to appropriate page based on status

## Route Protection

### Public Routes

These routes are accessible without authentication:

```javascript
const PUBLIC_ROUTES = [
  '/auth', 
  '/auth/callback', 
  '/', 
  '/legal', 
  '/legal/privacy-policy', 
  '/legal/terms',
  '/contact',
  '/contact/business',
  '/unauthorized'
]
```

### Protected Routes

All routes not explicitly listed as public require authentication. The middleware redirects unauthenticated users to the login page.

### Admin Routes

Routes starting with `/admin` are restricted to users with administrator privileges. Non-admin users attempting to access these routes are redirected to the dashboard.

## Authentication Verification

The middleware uses Supabase Auth to verify authentication:

```javascript
const supabase = createMiddlewareClient({ req, res })

// Get user and session
const { data: { user }, error: userError } = await supabase.auth.getUser()
const { data: { session }, error: sessionError } = await supabase.auth.getSession()

// Verify authentication
const isAuthenticated = !!user && !!session
```

## Admin Verification

Admin status is verified through multiple methods:

1. **Hardcoded Admin List**: For critical admin accounts
   ```javascript
   const ADMIN_USER_IDS = [
     'ca75f6c9-9b0b-412c-8b8d-c9d8b36559d9', // support@frogagent.com
   ]
   ```

2. **Admin Email Check**: Verification against approved email list
   ```javascript
   const ADMIN_EMAILS = [
     'senna@frogagent.com',
     'support@frogagent.com'
   ]
   ```

3. **Database Check**: Query to the `admin_roles` table
   ```javascript
   const adminCheckResponse = await fetch(`${supabaseUrl}/rest/v1/admin_roles?user_id=eq.${user.id}&select=user_id`, {
     headers: {
       'apikey': serviceKey,
       'Authorization': `Bearer ${serviceKey}`,
     }
   });
   ```

## Onboarding Enforcement

The middleware ensures users complete the onboarding process:

1. Checks if user has a profile record
2. Verifies if `onboarding_completed` is true
3. Redirects to onboarding page if incomplete
4. Prevents access to other pages until onboarding is complete

```javascript
const { data: profile, error: profileError } = await supabase
  .from('profiles')
  .select('onboarding_completed')
  .eq('id', user.id)
  .single()

if (!profile || !profile.onboarding_completed) {
  // Redirect to onboarding
}
```

## Special Access Cases

### School Editor Access

The middleware handles token-based access for school representatives:

```javascript
// Check for token-based school editor access
if (isSchoolEditorWithToken(pathname, searchParams)) {
  return NextResponse.next();
}
```

### Invitation-Only Access

During pre-release phases, access can be restricted to invited users:

```javascript
// Check if user is in invited list
const invitedEmails = process.env.NEXT_PUBLIC_INVITED_EMAILS?.split(',') || []
if (!invitedEmails.includes(user.email) && !isUnauthorizedPage(pathname)) {
  return NextResponse.redirect(new URL('/unauthorized', baseUrl));
}
```

## Redirection Logic

The middleware implements sophisticated redirection logic:

1. **Unauthenticated Users**: Redirected to login or landing page
2. **Incomplete Onboarding**: Redirected to onboarding page
3. **Admin Users**: Redirected to admin dashboard from public routes
4. **Regular Users**: Redirected to dashboard from public routes
5. **Unauthorized Access**: Redirected to appropriate error page

## Configuration

The middleware is configured to run on all routes except static assets:

```javascript
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}
```

## Error Handling

The middleware implements robust error handling:

- Graceful handling of authentication errors
- Fallback mechanisms for database query failures
- Logging of critical errors for debugging

## Next Steps

For more information about related topics:
- [Authentication Flow](./authentication.md)
- [User Roles](../overview/user-roles.md)
- [Security Considerations](./security.md)
