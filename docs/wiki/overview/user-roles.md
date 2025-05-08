# User Roles

Frog Members serves different types of users, each with specific permissions and capabilities within the platform. Understanding these roles is essential for developers working on the platform.

## Student Users

Students are the primary users of the platform, seeking educational opportunities abroad.

### Permissions
- Browse and search courses
- Create and manage a user profile
- Save favorite courses
- Submit course applications
- Create and submit visa plans
- Access learning resources
- Interact with the AI assistant
- Participate in community features
- Track application status
- Manage personal documents

### User Journey
1. **Registration & Onboarding**: Create account and complete profile
2. **Course Discovery**: Search and save potential courses
3. **Application**: Submit applications to selected institutions
4. **Visa Planning**: Create and submit visa application plans
5. **Pre-departure**: Access resources and prepare for study abroad
6. **Ongoing Support**: Continue to use platform resources during studies

## School Administrators

Representatives from educational institutions who manage their school's presence on the platform.

### Permissions
- Manage school profile information
- Create and update course listings
- Review applications from students
- Communicate with applicants
- Access analytics about their institution's performance
- Limited to managing only their own institution's content

### Access Method
School administrators access a special editor interface using a secure token link. This allows them to manage their content without requiring full admin privileges.

## Platform Administrators

Staff members who manage the overall platform operation.

### Permissions
- Full access to all platform features
- User management (create, edit, delete)
- Content moderation across all sections
- Application review and processing
- Visa plan review and feedback
- System configuration and settings
- Analytics and reporting
- Integration management

### Admin Sections
- User Management
- Application Processing
- Visa Review
- Course Management
- School Management
- Content Management
- System Configuration
- Analytics Dashboard

## Authentication and Access Control

Access control is implemented through the middleware system, which:

1. Checks user authentication status
2. Verifies user role (admin vs. regular user)
3. Redirects users to appropriate sections based on their role
4. Ensures completion of required steps (e.g., onboarding)
5. Protects admin routes from unauthorized access

## Role Assignment

- **Student Users**: Default role assigned upon registration
- **School Administrators**: Assigned by platform administrators with specific school association
- **Platform Administrators**: Assigned through the admin_roles database table or hardcoded admin lists

## Next Steps

For technical details on how authentication and authorization are implemented, see:
- [Authentication Flow](../technical/authentication.md)
- [Middleware Implementation](../technical/middleware.md)
