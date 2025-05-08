# Authentication Flow

This document details the authentication system used in Frog Members, including user authentication, session management, and access control.

## Authentication Provider

Frog Members uses Supabase Authentication for user management:

- **Email/Password Authentication**: Traditional email and password login
- **OAuth Providers**: Support for social login (Google, etc.)
- **Magic Link**: Passwordless authentication via email links

## Authentication Flow

### Registration Process

1. User submits registration form with email and password
2. Supabase creates a new user account
3. System creates a corresponding profile record in the `profiles` table
4. User receives confirmation email
5. Upon first login, user is directed to the onboarding process

### Login Process

1. User submits login credentials
2. Supabase validates credentials and issues a session token
3. Session token is stored in cookies
4. Middleware checks user's profile status
5. User is redirected based on:
   - Admin status (to admin dashboard)
   - Onboarding completion status (to onboarding or dashboard)

### Session Management

- **Session Duration**: Configurable, default is 1 week
- **Session Storage**: Secure, HTTP-only cookies
- **Refresh Mechanism**: Automatic token refresh when approaching expiration

## Middleware Protection

The application uses Next.js middleware (`middleware.ts`) to protect routes and manage redirects based on authentication status:

### Key Middleware Functions

1. **Authentication Check**: Verifies if user is authenticated
2. **Profile Verification**: Checks if user has completed profile setup
3. **Admin Role Verification**: Determines if user has admin privileges
4. **Route Protection**: Restricts access to protected routes
5. **Redirection Logic**: Directs users to appropriate pages based on status

### Protected Route Categories

- **Public Routes**: Accessible without authentication (landing page, auth pages)
- **User Routes**: Require authentication but no admin privileges
- **Admin Routes**: Require authentication and admin privileges
- **Onboarding Routes**: Special handling for the onboarding process

## Admin Authentication

Admin users are identified through multiple mechanisms:

1. **Hardcoded Admin List**: Emergency fallback for critical admin accounts
2. **Admin Roles Table**: Database table mapping users to admin roles
3. **Admin Email Check**: Verification against approved admin email list

The system uses a cascading check to verify admin status, starting with the fastest method (hardcoded list) and proceeding to more dynamic checks as needed.

## Special Access Cases

### School Editor Access

- School representatives can access a limited editor interface using secure tokens
- Token-based access is implemented via URL parameters
- This allows external users to manage their content without full platform accounts

### Invitation-Only Access

- During pre-release phases, access can be restricted to invited users only
- Invitation status is checked against an environment variable containing approved emails

## Security Considerations

- **HTTPS**: All authentication traffic is encrypted
- **CSRF Protection**: Built-in protection against cross-site request forgery
- **Rate Limiting**: Prevents brute force attacks on authentication endpoints
- **Secure Cookies**: HTTP-only, secure cookies for session storage
- **Service Role**: Limited use of privileged service role for admin verification only

## Code Implementation

The primary authentication logic is implemented in:

- `middleware.ts`: Route protection and redirection
- `app/auth/`: Authentication UI components
- `app/actions.ts`: Server actions for authentication operations
- `lib/supabase-client.ts`: Supabase client configuration

## Next Steps

For related information, see:
- [Database Schema](./database.md) for user and profile table structure
- [Middleware Implementation](./middleware.md) for detailed middleware logic
- [User Roles](../overview/user-roles.md) for permission details
