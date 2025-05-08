# Database Schema

This document outlines the database schema used in the Frog Members platform, providing an overview of the tables, relationships, and key fields.

## Database Provider

Frog Members uses Supabase PostgreSQL as its database provider, leveraging:

- PostgreSQL's robust relational database capabilities
- Supabase's row-level security for fine-grained access control
- Real-time subscriptions for live updates
- Full-text search for efficient content queries

## Core Tables

### Users and Authentication

#### profiles
Stores user profile information linked to Supabase auth.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key, matches Supabase auth user ID |
| email | text | User's email address |
| first_name | text | User's first name |
| last_name | text | User's last name |
| phone | text | Contact phone number |
| country | text | User's country of residence |
| education_level | text | Highest education level |
| study_field | text | Field of study interest |
| migration_goal | text | Reason for studying abroad |
| onboarding_completed | boolean | Whether onboarding is complete |
| stripe_customer_id | text | Associated Stripe customer ID |
| created_at | timestamp | Record creation timestamp |
| updated_at | timestamp | Record update timestamp |

#### admin_roles
Defines administrator privileges for users.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| user_id | uuid | Foreign key to profiles.id |
| role | text | Admin role type |
| created_at | timestamp | Record creation timestamp |

### Educational Content

#### schools
Educational institutions available on the platform.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| name | text | School name |
| description | text | School description |
| location | text | Physical location |
| website | text | School website URL |
| logo_url | text | School logo image URL |
| created_at | timestamp | Record creation timestamp |
| updated_at | timestamp | Record update timestamp |

#### courses
Educational courses offered by schools.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| school_id | uuid | Foreign key to schools.id |
| title | text | Course title |
| description | text | Course description |
| level | text | Education level (e.g., Bachelor's, Master's) |
| field | text | Field of study |
| duration | integer | Course duration in months |
| start_dates | jsonb | Available start dates |
| tuition_fee | integer | Cost of tuition |
| language | text | Primary language of instruction |
| requirements | jsonb | Entry requirements |
| created_at | timestamp | Record creation timestamp |
| updated_at | timestamp | Record update timestamp |

#### favorite_courses
Tracks courses favorited by users.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| user_id | uuid | Foreign key to profiles.id |
| course_id | uuid | Foreign key to courses.id |
| created_at | timestamp | Record creation timestamp |

### Applications

#### course_applications
Tracks user applications to courses.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| user_id | uuid | Foreign key to profiles.id |
| course_id | uuid | Foreign key to courses.id |
| status | text | Application status |
| content_snare_id | text | Content Snare submission ID |
| notes | text | Application notes |
| created_at | timestamp | Record creation timestamp |
| updated_at | timestamp | Record update timestamp |

#### application_documents
Documents submitted for applications.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| application_id | uuid | Foreign key to course_applications.id |
| document_type | text | Type of document |
| file_url | text | URL to stored document |
| status | text | Document status |
| created_at | timestamp | Record creation timestamp |

### Visa Planning

#### visa_types
Available visa types for different countries.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| country | text | Country the visa is for |
| name | text | Visa type name |
| description | text | Visa description |
| duration | text | Validity duration |
| requirements | jsonb | Required documents and conditions |
| processing_time | text | Typical processing time |
| created_at | timestamp | Record creation timestamp |

#### visa_plans
User-created visa application plans.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| user_id | uuid | Foreign key to profiles.id |
| title | text | Plan title |
| status | text | Plan status |
| notes | text | User notes |
| created_at | timestamp | Record creation timestamp |
| updated_at | timestamp | Record update timestamp |

#### visa_plan_items
Individual visas within a plan.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| plan_id | uuid | Foreign key to visa_plans.id |
| visa_type_id | uuid | Foreign key to visa_types.id |
| order | integer | Sequence order in plan |
| notes | text | Item-specific notes |
| created_at | timestamp | Record creation timestamp |

#### visa_reviews
Admin reviews of visa plans.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| plan_id | uuid | Foreign key to visa_plans.id |
| reviewer_id | uuid | Foreign key to profiles.id |
| status | text | Review status |
| comments | text | Review comments |
| created_at | timestamp | Record creation timestamp |
| updated_at | timestamp | Record update timestamp |

### AI Assistant

#### conversations
Tracks AI assistant conversations.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| user_id | uuid | Foreign key to profiles.id |
| title | text | Conversation title |
| created_at | timestamp | Record creation timestamp |

#### messages
Individual messages in conversations.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| conversation_id | uuid | Foreign key to conversations.id |
| role | text | Message sender role (user/assistant) |
| content | text | Message content |
| created_at | timestamp | Record creation timestamp |

## Database Relationships

Key relationships between tables:

- **One-to-One**: profiles ↔ Supabase auth users
- **One-to-Many**: 
  - schools → courses
  - profiles → course_applications
  - profiles → visa_plans
  - visa_plans → visa_plan_items
  - profiles → conversations
  - conversations → messages
- **Many-to-Many**:
  - profiles ↔ courses (via favorite_courses)
  - profiles ↔ admin_roles

## Row-Level Security Policies

Supabase row-level security (RLS) policies control data access:

- Users can only access their own profile data
- Users can only view their own applications and documents
- Admin users have broader access based on their role
- Public data (courses, schools) is readable by all authenticated users
- Write operations are restricted based on user role and ownership

## Next Steps

For more information about related topics:
- [Authentication Flow](./authentication.md)
- [Supabase Integration](../api/supabase.md)
- [Data Access Patterns](../development/data-access.md)
