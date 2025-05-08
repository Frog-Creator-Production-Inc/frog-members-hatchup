# Admin Dashboard

The Admin Dashboard provides platform administrators with tools to manage users, content, applications, and system settings.

## Dashboard Overview

The admin dashboard is accessible only to users with administrator privileges and offers a comprehensive set of management tools:

- User and profile management
- Application processing
- Visa plan reviews
- Course and school management
- Content administration
- System configuration
- Analytics and reporting

## Access Control

Access to the admin dashboard is restricted through multiple security layers:

1. **Authentication Check**: Verifies user is logged in
2. **Admin Role Verification**: Checks if user has admin privileges through:
   - Hardcoded admin list
   - Admin roles database table
   - Admin email verification

The middleware (`middleware.ts`) handles these checks and redirects non-admin users to appropriate pages.

## Key Admin Features

### Application Management

Administrators can process student applications:

- View all applications with filtering and sorting
- Review application details and submitted documents
- Update application status (reviewing, approved, rejected)
- Communicate with applicants
- Generate reports on application metrics

Implementation: `app/admin/applications/` directory

### Visa Plan Reviews

Administrators review student visa plans:

- View submitted visa plans
- Add comments and suggestions
- Approve plans or request changes
- Track revision history
- Provide guidance on visa requirements

Implementation: `app/admin/visa-reviews/` directory

### Course Management

Tools for managing course listings:

- Create new courses
- Edit existing course information
- Associate courses with schools
- Manage course categories
- Set application requirements
- Archive outdated courses

Implementation: `app/admin/courses/` directory

### User Management

User administration capabilities:

- View and search user accounts
- Edit user profiles
- Manage user roles and permissions
- Monitor user activity
- Handle support requests

Implementation: `app/admin/profiles/` directory

### Content Management

Content administration tools:

- Manage learning resources
- Edit static page content
- Create and publish announcements
- Moderate community content
- Manage interview articles

Implementation: Various admin sections

## Admin UI Components

### Common Components

- `AdminLayout`: Base layout for all admin pages
- `AdminHeader`: Navigation and user information
- `AdminSidebar`: Section navigation
- `AdminTable`: Standardized data table with sorting and filtering
- `AdminFilters`: Common filtering interface
- `StatusBadge`: Visual indicators for various statuses

### Page Structure

Admin pages typically follow this structure:

```
admin/[section]/
├── page.tsx                # List view
├── [id]/                   # Detail view
│   ├── page.tsx            # Detail page
│   └── components/         # Detail components
├── components/             # Section-specific components
└── actions.ts              # Server actions
```

## Database Interactions

Admin functionality primarily interacts with these database tables:

- `profiles`: User profile information
- `admin_roles`: Admin user permissions
- `courses`: Course listings
- `schools`: Educational institutions
- `course_applications`: Student applications
- `visa_plans`: Visa planning data
- `visa_reviews`: Admin reviews of visa plans

## Integration Points

The admin dashboard integrates with several external services:

- **Content Snare**: For document review
- **Slack**: For notifications about important events
- **MicroCMS**: For content management
- **Supabase**: For database operations and authentication

## Next Steps

For more information about related features:
- [Authentication Flow](../technical/authentication.md)
- [Course Management](./courses.md)
- [Visa Planning](./visa-planning.md)
