# Stripe Integration

This document details the integration between Frog Members and Stripe for payment processing.

## Overview

Stripe is used for handling subscription payments and one-time charges within the platform. The integration enables:

- Subscription management for premium features
- Secure payment processing
- Customer portal access for subscription management
- Webhook handling for payment events

## API Endpoints

### Subscription Creation

- **Endpoint**: `/api/stripe/create-subscription`
- **Method**: POST
- **Body**: `{ userId: string }`
- **Description**: Creates a Stripe checkout session for a user to subscribe
- **Implementation**: `app/api/stripe/create-subscription/route.ts`

### Subscription Cancellation

- **Endpoint**: `/api/stripe/cancel-subscription`
- **Method**: POST
- **Body**: `{ userId: string }`
- **Description**: Cancels a user's active subscription
- **Implementation**: `app/api/stripe/cancel-subscription/route.ts`

### Customer Portal Session

- **Endpoint**: `/api/stripe/create-customer-portal-session`
- **Method**: POST
- **Body**: `{ customerId: string }`
- **Description**: Creates a session for the Stripe Customer Portal
- **Implementation**: `app/api/stripe/create-customer-portal-session/route.ts`

### Webhook Handler

- **Endpoint**: `/api/stripe/webhook`
- **Method**: POST
- **Description**: Processes webhook events from Stripe
- **Implementation**: `app/api/stripe/webhook/route.ts`

## Implementation Details

### Customer Creation

When a user signs up, a corresponding Stripe customer is created:

```typescript
// Simplified example
async function createStripeCustomer(userId: string, email: string) {
  const customer = await stripe.customers.create({
    email,
    metadata: {
      userId
    }
  });
  
  // Store customer ID in database
  await supabase
    .from('profiles')
    .update({ stripe_customer_id: customer.id })
    .eq('id', userId);
    
  return customer;
}
```

### Subscription Flow

1. User requests subscription
2. System creates Stripe checkout session
3. User completes payment on Stripe-hosted page
4. Webhook receives successful payment event
5. System updates user's subscription status
6. User gains access to premium features

### Webhook Processing

The webhook handler processes various Stripe events:

```typescript
// Simplified example
export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature') as string;
  
  try {
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
    
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object);
        break;
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionCancelled(event.data.object);
        break;
      // Handle other events
    }
    
    return new Response(JSON.stringify({ received: true }), {
      status: 200
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 400 }
    );
  }
}
```

## Database Schema

Stripe-related data is stored in these database tables:

- **profiles**: Contains `stripe_customer_id` field
- **subscriptions**: Tracks subscription status, plan, and period

## Security Considerations

- **Environment Variables**: Stripe API keys are stored securely
- **Webhook Signatures**: All webhook events are verified using signatures
- **PCI Compliance**: Payment information is handled on Stripe's servers
- **Error Handling**: Robust error handling for payment failures

## Testing

For testing the Stripe integration:

1. Use Stripe test mode with test API keys
2. Utilize Stripe's test cards for simulating payments
3. Test webhook events using Stripe CLI
4. Verify subscription status updates correctly

## Next Steps

For more information about related features:
- [Environment Variables](../deployment/environment-variables.md)
- [API Security](../technical/api-security.md)
- [User Profiles](../features/user-profiles.md)
