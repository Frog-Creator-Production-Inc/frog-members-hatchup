# Environment Variables

This document outlines the environment variables used in the Frog Members platform and how to manage them.

## Environment Variable Management

Frog Members uses a combination of standard environment variables and encrypted variables using `.env.vault` for enhanced security.

### Environment Files

- `.env.local`: Local development variables (not committed to repository)
- `.env.vault`: Encrypted environment variables for production
- `.env.example`: Example template with required variables (no actual values)

## Required Environment Variables

### Authentication

```
# Supabase Authentication
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### External Services

```
# Stripe Integration
STRIPE_SECRET_KEY=sk_test_your_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_key

# MicroCMS Integration
MICROCMS_API_KEY=your-api-key
MICROCMS_SERVICE_DOMAIN=your-service-domain

# Content Snare Integration
CONTENT_SNARE_API_KEY=your-api-key
CONTENT_SNARE_ACCOUNT_ID=your-account-id

# OpenAI Integration
OPENAI_API_KEY=your-api-key

# Slack Integration
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/your-webhook-url
```

### Application Configuration

```
# General Configuration
NEXT_PUBLIC_APP_URL=https://your-app-url.com
NODE_ENV=development|production

# Feature Flags
NEXT_PUBLIC_ENABLE_AI_CHAT=true|false
NEXT_PUBLIC_MAINTENANCE_MODE=true|false

# Access Control
NEXT_PUBLIC_INVITED_EMAILS=email1@example.com,email2@example.com
```

## Environment Variable Usage

### In Server-Side Code

```typescript
// Using environment variables in server-side code
const apiKey = process.env.SOME_API_KEY;
const serviceUrl = process.env.SERVICE_URL;

// Example with validation
if (!process.env.REQUIRED_API_KEY) {
  throw new Error("Missing required environment variable: REQUIRED_API_KEY");
}
```

### In Client-Side Code

Only variables prefixed with `NEXT_PUBLIC_` are available in client-side code:

```typescript
// Using public environment variables in client-side code
const appUrl = process.env.NEXT_PUBLIC_APP_URL;
const enableFeature = process.env.NEXT_PUBLIC_FEATURE_FLAG === 'true';
```

## Environment Variable Encryption

For enhanced security, sensitive environment variables are encrypted using `.env.vault`:

1. Install the dotenv-vault CLI: `npm install -g dotenv-vault`
2. Initialize: `npx dotenv-vault new`
3. Add variables: `npx dotenv-vault add VARIABLE_NAME`
4. Push to vault: `npx dotenv-vault push`
5. Build for environments: `npx dotenv-vault build`

## Environment Setup for Different Environments

### Local Development

1. Copy `.env.example` to `.env.local`
2. Fill in required values
3. Use `npm run dev` to start development server

### CI/CD Pipeline

Environment variables are configured in the Vercel project settings and automatically applied during deployment.

### Production

Production environment variables are managed through:
1. Vercel Environment Variables UI
2. `.env.vault` for encrypted variables

## Best Practices

- Never commit actual environment variable values to the repository
- Use different values for development, staging, and production
- Regularly rotate sensitive keys and secrets
- Limit access to production environment variables
- Use the most restrictive permissions possible for API keys

## Troubleshooting

Common environment variable issues:

1. **Missing Variables**: Check for undefined variables in server logs
2. **Client/Server Mismatch**: Ensure client-side variables have `NEXT_PUBLIC_` prefix
3. **Type Issues**: Environment variables are always strings, convert as needed
4. **Encryption Problems**: Verify `.env.vault` is properly configured

## Next Steps

For more information about related topics:
- [Deployment Process](./vercel.md)
- [Security Considerations](../technical/security.md)
- [CI/CD Pipeline](./ci-cd.md)
