# Content Snare Integration

This document details the integration between Frog Members and Content Snare for document collection and management.

## Overview

Content Snare is a document collection platform used in Frog Members to:

- Collect application documents from students
- Manage document requirements for different courses
- Track document submission status
- Provide a secure interface for document uploads

## Integration Setup

### Configuration

The Content Snare integration is configured in `lib/api/content-snare.ts`:

```typescript
// Content Snare API configuration
const CONTENT_SNARE_API_URL = 'https://api.contentsnare.com/v1';
const CONTENT_SNARE_ACCOUNT_ID = process.env.CONTENT_SNARE_ACCOUNT_ID;
const CONTENT_SNARE_API_KEY = process.env.CONTENT_SNARE_API_KEY;

// API headers
const getHeaders = () => ({
  'X-API-KEY': CONTENT_SNARE_API_KEY,
  'Content-Type': 'application/json',
});
```

### Environment Variables

Required environment variables:

```
CONTENT_SNARE_API_KEY=your-api-key
CONTENT_SNARE_ACCOUNT_ID=your-account-id
```

## Document Collection Process

### Submission Creation

When a user applies to a course, a Content Snare submission is created:

```typescript
// Create a new submission
export async function createSubmission(applicationData) {
  try {
    const response = await fetch(`${CONTENT_SNARE_API_URL}/submissions`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        account_id: CONTENT_SNARE_ACCOUNT_ID,
        template_id: applicationData.templateId,
        name: `${applicationData.courseName} - ${applicationData.userName}`,
        email: applicationData.userEmail,
        custom_fields: {
          application_id: applicationData.applicationId,
          course_id: applicationData.courseId,
          user_id: applicationData.userId,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to create submission: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error creating Content Snare submission:', error);
    throw error;
  }
}
```

### Submission Status Tracking

The application monitors submission status through webhooks:

```typescript
// Process webhook event
export async function processWebhook(event) {
  const { event_type, submission } = event;
  
  // Get application ID from custom fields
  const applicationId = submission.custom_fields.application_id;
  
  // Update application status based on event
  switch (event_type) {
    case 'submission.completed':
      await updateApplicationStatus(applicationId, 'DOCUMENTS_SUBMITTED');
      break;
    case 'submission.approved':
      await updateApplicationStatus(applicationId, 'DOCUMENTS_APPROVED');
      break;
    // Handle other event types
  }
}
```

## API Endpoints

### Submission Creation

- **Endpoint**: `/api/content-snare/create-submission`
- **Method**: POST
- **Body**: Application and user information
- **Description**: Creates a new Content Snare submission
- **Implementation**: `app/api/content-snare/create-submission/route.ts`

### Webhook Handler

- **Endpoint**: `/api/content-snare/webhook`
- **Method**: POST
- **Description**: Processes webhook events from Content Snare
- **Implementation**: `app/api/content-snare/webhook/route.ts`

### Submission Status

- **Endpoint**: `/api/content-snare/submission-status`
- **Method**: GET
- **Query**: `{ submissionId: string }`
- **Description**: Gets the current status of a submission
- **Implementation**: `app/api/content-snare/submission-status/route.ts`

## Document Templates

Content Snare templates are configured for different document requirements:

- **General Application**: Basic documents for all applications
- **Student Visa**: Documents specific to student visa applications
- **Course-Specific**: Custom document requirements for specific courses

## User Experience

### Document Submission Flow

1. User applies to a course
2. System creates a Content Snare submission
3. User receives email with submission link
4. User uploads required documents through Content Snare interface
5. Admin reviews submitted documents
6. System updates application status based on document review

### Status Display

The application displays document submission status to users:

```typescript
// Example status component
const DocumentStatus = ({ applicationId }) => {
  const { data, isLoading } = useQuery(
    ['documentStatus', applicationId],
    () => fetchDocumentStatus(applicationId)
  );
  
  if (isLoading) return <Spinner />;
  
  return (
    <div className="document-status">
      <h3>Document Status</h3>
      <StatusBadge status={data.status} />
      <ProgressBar progress={data.completionPercentage} />
      {data.missingDocuments.length > 0 && (
        <MissingDocumentsList documents={data.missingDocuments} />
      )}
    </div>
  );
};
```

## Admin Features

Administrators can manage document submissions:

- View all submissions with filtering and sorting
- Review submitted documents
- Request additional documents or revisions
- Approve or reject submissions
- Generate reports on document status

## Security Considerations

- API keys are stored as environment variables
- Webhook signatures are verified for authenticity
- Document access is restricted to authorized users
- Sensitive document data is handled securely

## Next Steps

For more information about related topics:
- [Course Application Process](../features/courses.md)
- [Admin Dashboard](../features/admin-dashboard.md)
- [API Security](../technical/api-security.md)
