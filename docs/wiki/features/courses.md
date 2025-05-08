# Course Search & Application

The course search and application system is a core feature of Frog Members, allowing users to discover educational opportunities and submit applications.

## Course Search

### Search Functionality

The course search system provides multiple ways to find relevant courses:

- **Text Search**: Full-text search across course titles and descriptions
- **Filters**: Refinement by location, field of study, duration, level, etc.
- **Sorting**: Options to sort by relevance, start date, price, etc.
- **Saved Searches**: Ability to save search criteria for future use

### Implementation

The search functionality is implemented in `app/courses/page.tsx` and related components:

- Uses server-side rendering for initial results
- Implements client-side filtering for quick refinement
- Utilizes Supabase full-text search capabilities
- Caches results for improved performance

## Course Details

### Content Display

Each course has a dedicated page showing comprehensive information:

- Course title, description, and key details
- Institution information
- Entry requirements
- Curriculum overview
- Cost and financial information
- Start dates and duration
- Location and facilities
- Application process

### Related Information

Course pages also display:

- Similar courses recommendations
- Institution profile
- Student reviews (if available)
- FAQ section

## Application Process

### Application Flow

The application process follows these steps:

1. **Initial Interest**: User clicks "Apply" on a course page
2. **Application Form**: User completes basic application information
3. **Document Collection**: Integration with Content Snare for document submission
4. **Submission**: Application is submitted to the institution
5. **Status Tracking**: User can monitor application status
6. **Communication**: Messaging system for questions and updates

### Technical Implementation

The application system uses several components:

- `CourseApplyButton`: Initiates the application process
- `ApplicationForm`: Collects initial application data
- Content Snare API: Manages document collection
- Supabase Database: Stores application status and history
- Notification System: Alerts users and admins about status changes

## Favorites System

Users can save courses to their favorites for later reference:

- Toggle favorite status from course cards or detail pages
- View all favorites in the dashboard
- Receive notifications about changes to favorited courses
- Compare favorited courses side by side

## Admin Course Management

Administrators can manage course listings through the admin interface:

- Create new course listings
- Edit existing course information
- Manage application settings
- View application statistics
- Archive outdated courses

## Database Schema

The course system uses several database tables:

- `courses`: Core course information
- `schools`: Educational institution details
- `course_applications`: User applications to courses
- `favorite_courses`: User's saved courses
- `course_categories`: Classification and categorization

## API Endpoints

Key API endpoints for the course system:

- `GET /api/courses`: List courses with filtering
- `GET /api/courses/[id]`: Get detailed course information
- `POST /api/courses/favorite`: Toggle favorite status
- `POST /api/content-snare/create-submission`: Create document submission

## Integration Points

The course system integrates with:

- **Content Snare**: For document collection
- **MicroCMS**: For supplementary course content
- **Supabase**: For data storage and retrieval
- **Notification System**: For status updates
- **Dashboard**: For displaying relevant courses

## Next Steps

For more information about related features:
- [Admin Dashboard](./admin-dashboard.md)
- [Content Snare Integration](../api/content-snare.md)
- [Database Schema](../technical/database.md)
