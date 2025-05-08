# Technology Stack

Frog Members is built using modern web technologies to provide a robust, scalable, and user-friendly platform. This document outlines the core technologies used in the project.

## Frontend

### Next.js
- **Version**: Latest stable (App Router)
- **Purpose**: React framework for server-side rendering, static site generation, and client-side rendering
- **Key Features Used**: 
  - App Router for file-based routing
  - Server Components for improved performance
  - Server Actions for form handling
  - Middleware for authentication and routing

### TypeScript
- **Purpose**: Strongly-typed JavaScript for improved developer experience and code quality
- **Configuration**: Custom tsconfig.json with strict type checking

### UI Framework
- **Primary**: Tailwind CSS for utility-first styling
- **Component Library**: shadcn/ui for accessible, customizable components
- **Icons**: Lucide React for consistent iconography

### State Management
- **Server State**: React Query for data fetching, caching, and state management
- **Client State**: React Context API for global state where needed
- **Forms**: React Hook Form for form state management and validation

## Backend

### Supabase
- **Purpose**: Backend-as-a-Service providing authentication, database, and storage
- **Features Used**:
  - PostgreSQL database
  - Row-level security policies
  - Authentication system
  - Storage for user documents
  - Realtime subscriptions

### API Routes
- **Implementation**: Next.js API routes for serverless functions
- **Authentication**: Supabase Auth Helpers for Next.js

### External APIs
- **MicroCMS**: Headless CMS for managing content
- **Content Snare**: Document collection and management
- **OpenAI**: AI capabilities for the chat assistant
- **Stripe**: Payment processing for subscriptions
- **Slack**: Notifications for admin events

## Infrastructure

### Hosting
- **Platform**: Vercel for production deployment
- **CI/CD**: Vercel's built-in CI/CD pipeline
- **Preview Deployments**: Automatic for pull requests

### Environment Management
- **Tool**: Vercel Environment Variables
- **Security**: Environment Variable Encryption with .env.vault

### Monitoring
- **Error Tracking**: Sentry
- **Analytics**: Vercel Analytics
- **Logging**: Custom logging to Supabase

## Development Tools

### Package Management
- **Primary**: npm for dependency management
- **Lock File**: package-lock.json for consistent installations

### Code Quality
- **Linting**: ESLint with custom configuration
- **Formatting**: Prettier for consistent code style
- **Type Checking**: TypeScript with strict mode

### Version Control
- **System**: Git
- **Platform**: GitHub
- **Workflow**: Feature branch workflow with pull requests

## Next Steps

For more detailed information about specific aspects of the technology stack:

- [Authentication Flow](./authentication.md)
- [Database Schema](./database.md)
- [Environment Setup](../development/setup.md)
