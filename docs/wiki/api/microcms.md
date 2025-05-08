# MicroCMS Integration

This document details the integration between Frog Members and MicroCMS for content management.

## Overview

MicroCMS is a headless content management system used in Frog Members to manage:

- Learning resources and articles
- Student interview content
- Static page content
- News and announcements
- FAQ sections

## Integration Setup

### Configuration

The MicroCMS integration is configured in `lib/microcms.ts`:

```typescript
import { createClient } from 'microcms-js-sdk';

// MicroCMS client configuration
export const microcmsClient = createClient({
  serviceDomain: process.env.MICROCMS_SERVICE_DOMAIN || '',
  apiKey: process.env.MICROCMS_API_KEY || '',
});
```

### Environment Variables

Required environment variables:

```
MICROCMS_API_KEY=your-api-key
MICROCMS_SERVICE_DOMAIN=your-service-domain
```

## Content Types

The integration uses several MicroCMS content types:

### Learning Resources

Educational content for international students:

- Articles about studying abroad
- Country guides
- Language preparation resources
- Cultural adaptation guides

### Interviews

Student experience interviews:

- Success stories
- Study abroad experiences
- Career journeys
- Tips and advice

### Static Content

Website static content:

- Landing page sections
- About us information
- Service descriptions
- Legal content

## Data Fetching

### Caching Implementation

The integration includes a caching mechanism to improve performance:

```typescript
// In-memory cache
const cache = new Map();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

// Fetch with cache
export async function getWithCache(endpoint, queries = {}) {
  const cacheKey = `${endpoint}:${JSON.stringify(queries)}`;
  
  // Check cache
  if (cache.has(cacheKey)) {
    const { data, timestamp } = cache.get(cacheKey);
    if (Date.now() - timestamp < CACHE_TTL) {
      return data;
    }
  }
  
  // Fetch from API
  const data = await microcmsClient.get({
    endpoint,
    queries
  });
  
  // Update cache
  cache.set(cacheKey, {
    data,
    timestamp: Date.now()
  });
  
  return data;
}
```

### Usage Examples

Fetching learning resources:

```typescript
// Get learning resources with pagination
export async function getLearningResources(page = 1, limit = 10) {
  return getWithCache('learning', {
    offset: (page - 1) * limit,
    limit,
    orders: '-publishedAt'
  });
}

// Get a single learning resource by ID
export async function getLearningResourceById(id) {
  return getWithCache(`learning/${id}`);
}
```

Fetching interviews:

```typescript
// Get interviews with filtering
export async function getInterviews(filters = {}) {
  return getWithCache('interviews', {
    filters,
    orders: '-publishedAt'
  });
}
```

## Content Display

### Server Components

MicroCMS content is typically fetched in server components:

```typescript
// Example server component
export default async function InterviewPage({ params }) {
  const interview = await getInterviewBySlug(params.slug);
  
  return (
    <article>
      <h1>{interview.title}</h1>
      <div className="metadata">
        <span>{formatDate(interview.publishedAt)}</span>
        <span>{interview.category}</span>
      </div>
      <div dangerouslySetInnerHTML={{ __html: interview.content }} />
    </article>
  );
}
```

### Rich Text Rendering

MicroCMS rich text content is rendered with appropriate sanitization:

```typescript
import DOMPurify from 'isomorphic-dompurify';

// Render sanitized rich text
function RichText({ content }) {
  const sanitizedContent = DOMPurify.sanitize(content);
  return <div dangerouslySetInnerHTML={{ __html: sanitizedContent }} />;
}
```

## API Endpoints

Custom API endpoints for MicroCMS content:

- `GET /api/microcms/learning`: Fetch learning resources
- `GET /api/microcms/interviews`: Fetch interview articles
- `GET /api/microcms/faq`: Fetch FAQ content

## Preview Mode

The integration supports MicroCMS preview mode for content editors:

```typescript
// Preview API route
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get('secret');
  const slug = searchParams.get('slug');
  
  // Validate secret
  if (secret !== process.env.MICROCMS_PREVIEW_SECRET) {
    return new Response(JSON.stringify({ message: 'Invalid token' }), {
      status: 401,
    });
  }
  
  // Enable preview mode
  const response = NextResponse.next();
  response.cookies.set('microcms-preview', true);
  
  // Redirect to content
  return NextResponse.redirect(`/interviews/${slug}`);
}
```

## Security Considerations

- API keys are stored as environment variables
- Content is sanitized before rendering
- Rate limiting is implemented for API requests
- Preview mode requires a secret token

## Next Steps

For more information about related topics:
- [Environment Variables](../deployment/environment-variables.md)
- [Learning Resources Feature](../features/learning-resources.md)
- [API Security](../technical/api-security.md)
