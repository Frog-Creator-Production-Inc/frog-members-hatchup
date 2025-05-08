# Directory Structure

This document provides an overview of the Frog Members codebase organization, helping new developers understand where to find and place different types of code.

## Root Directory

```
/
├── app/                  # Next.js application (App Router)
├── components/           # Shared UI components
├── docs/                 # Documentation
├── hooks/                # Custom React hooks
├── lib/                  # Utility functions and API clients
├── public/               # Static assets
├── sql/                  # SQL queries and migrations
├── styles/               # Global styles
├── supabase/             # Supabase configuration
├── types/                # TypeScript type definitions
├── .env.vault            # Encrypted environment variables
├── middleware.ts         # Next.js middleware
├── next.config.mjs       # Next.js configuration
├── package.json          # Dependencies and scripts
├── server.js             # Custom Express server
├── tailwind.config.ts    # Tailwind CSS configuration
├── tsconfig.json         # TypeScript configuration
└── vercel.json           # Vercel deployment configuration
```

## App Directory (Next.js App Router)

The `app` directory follows Next.js App Router conventions, with each route having its own directory:

```
app/
├── admin/                # Admin dashboard and tools
│   ├── applications/     # Application management
│   ├── chats/            # Chat history and management
│   ├── courses/          # Course management
│   ├── visa-reviews/     # Visa plan review interface
│   └── ...
├── aiagent/              # AI chat assistant
├── api/                  # API routes
│   ├── content-snare/    # Content Snare integration
│   ├── microcms/         # MicroCMS API endpoints
│   ├── slack/            # Slack notification endpoints
│   ├── stripe/           # Stripe payment endpoints
│   └── webhook/          # Webhook handlers
├── auth/                 # Authentication pages
├── courses/              # Course browsing and details
├── dashboard/            # User dashboard
├── interviews/           # Student interview articles
├── learning/             # Learning resources
├── onboarding/           # User onboarding flow
├── settings/             # User settings
├── visa/                 # Visa planning tools
├── actions.ts            # Server actions
├── globals.css           # Global styles
├── layout.tsx            # Root layout
└── page.tsx              # Landing page
```

### Page Structure

Each route typically follows this structure:

```
route-name/
├── components/           # Route-specific components
│   └── ...
├── actions.ts            # Server actions for this route
├── layout.tsx            # Layout for this route
└── page.tsx              # Page component
```

## Components Directory

Shared components used across multiple routes:

```
components/
├── ui/                   # Basic UI components (buttons, inputs, etc.)
├── layout/               # Layout components (headers, footers, etc.)
├── forms/                # Form components and utilities
└── ...
```

## Lib Directory

Utility functions, API clients, and helpers:

```
lib/
├── api/                  # API utility functions
├── supabase/             # Supabase utility functions
│   └── queries.ts        # Database query functions
├── microcms.ts           # MicroCMS client
├── supabase-client.ts    # Supabase client configuration
├── utils.ts              # General utility functions
└── ...
```

## Types Directory

TypeScript type definitions:

```
types/
├── api.ts                # API response and request types
├── database.ts           # Database schema types
├── supabase.ts           # Supabase-specific types
└── ...
```

## Hooks Directory

Custom React hooks:

```
hooks/
├── use-auth.ts           # Authentication hooks
├── use-form.ts           # Form handling hooks
├── use-courses.ts        # Course data hooks
└── ...
```

## Supabase Directory

Supabase configuration and schema:

```
supabase/
├── schema/               # Database schema definitions
├── functions/            # Supabase Edge Functions
└── ...
```

## SQL Directory

SQL queries and migrations:

```
sql/
├── migrations/           # Database migrations
├── queries/              # Common SQL queries
└── ...
```

## File Naming Conventions

- **React Components**: PascalCase (e.g., `CourseCard.tsx`)
- **Utility Functions**: camelCase (e.g., `formatDate.ts`)
- **Page Components**: `page.tsx` (Next.js convention)
- **Layout Components**: `layout.tsx` (Next.js convention)
- **Server Actions**: camelCase functions in `actions.ts` files
- **API Routes**: `route.ts` (Next.js convention)

## Next Steps

For more information about the codebase:
- [Coding Conventions](./coding-conventions.md)
- [Environment Setup](./setup.md)
- [Technology Stack](../technical/stack.md)
