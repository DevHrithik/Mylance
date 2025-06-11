# Stripe Integration Setup Guide

This guide will help you set up Stripe subscriptions for Mylance LinkedIn Content Thought Leadership.

## 🔧 Environment Variables

Add these environment variables to your `.env.local` file:

```bash
# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Existing Supabase variables
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## 🏗️ Database Setup

The database migration has already been applied with the following changes:

- Updated `plan_type` enum to include `'monthly'`
- Added `stripe_price_id` column to subscriptions table
- Added performance indexes for Stripe operations

## 💳 Stripe Configuration

### 1. Product Setup

Your product is already configured in Stripe:

- **Product**: Mylance LinkedIn Content Thought Leadership
- **Price ID**: `price_1RVHChFyiMqemrHZchIoJtX5`
- **Amount**: $139.50/month

### 2. Webhook Setup

Set up a webhook endpoint in your Stripe Dashboard:

1. Go to **Stripe Dashboard** → **Developers** → **Webhooks**
2. Click **"Add endpoint"**
3. Set the endpoint URL to: `https://your-domain.com/api/stripe/webhook`
4. Select these events to listen for:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy the webhook signing secret and add it to your environment variables as `STRIPE_WEBHOOK_SECRET`

## 🚀 Implementation Overview

### API Routes Created

1. **`/api/stripe/create-checkout-session`** - Creates Stripe checkout sessions
2. **`/api/stripe/webhook`** - Handles Stripe webhook events
3. **`/api/stripe/subscription-status`** - Checks user subscription status

### Components Created

1. **`SubscriptionPlanCard`** - Displays the subscription plan with purchase button
2. **`SubscriptionGuard`** - Protects premium features
3. **Updated billing page** - Shows subscription status and plan details

### Hooks Created

1. **`useSubscription`** - Manages subscription state and operations

## 🔒 Access Control

### User Types

- **Free Users**: Can see the subscription plan but cannot access premium features
- **Subscribers**: Full access to all features
- **Admins**: Automatic access without subscription required

### Protecting Features

Wrap any premium component with `SubscriptionGuard`:

```tsx
import { SubscriptionGuard } from "@/components/common/SubscriptionGuard";

export default function PremiumFeature() {
  return (
    <SubscriptionGuard>
      <div>Your premium content here</div>
    </SubscriptionGuard>
  );
}
```

Or use the hook for conditional rendering:

```tsx
import { useSubscription } from "@/hooks/useSubscription";

export default function SomeComponent() {
  const { hasAccess, isAdmin } = useSubscription();

  if (!hasAccess && !isAdmin) {
    return <div>Subscribe to access this feature</div>;
  }

  return <div>Premium content</div>;
}
```

## 📊 User Flow

1. **New User** signs up → Completes onboarding → Sees subscription plan
2. **Clicks "Get Started Now"** → Redirects to Stripe checkout
3. **Completes payment** → Webhook updates database → User gets access
4. **Accesses premium features** → SubscriptionGuard validates access

## 🛠️ Testing

### Test Mode

Use Stripe test keys and test card numbers:

- Card: `4242 4242 4242 4242`
- CVC: Any 3 digits
- Date: Any future date

### Test Scenarios

1. **Successful subscription**: Use test card → Complete checkout → Verify database update
2. **Failed payment**: Use declined card `4000 0000 0000 0002`
3. **Admin access**: Set `is_admin: true` in profiles table
4. **Subscription cancellation**: Cancel in Stripe dashboard → Verify webhook handling

## 🔄 Webhook Events Handled

- **`customer.subscription.created`**: New subscription → Update database
- **`customer.subscription.updated`**: Plan changes → Update subscription details
- **`customer.subscription.deleted`**: Cancellation → Update status to canceled
- **`invoice.payment_succeeded`**: Successful payment → Log success
- **`invoice.payment_failed`**: Failed payment → Update status to past_due

## 📝 Next Steps

1. **Set up environment variables** in your deployment platform
2. **Configure Stripe webhook** with your production domain
3. **Test the complete flow** in development
4. **Deploy to production** and verify webhook connectivity
5. **Monitor Stripe dashboard** for subscription events

## 💡 Usage Examples

### Check subscription in components:

```tsx
const { hasAccess, isAdmin, loading } = useSubscription();

if (loading) return <LoadingSpinner />;
if (!hasAccess && !isAdmin) return <UpgradePrompt />;
```

### Create checkout session:

```tsx
const { createCheckoutSession } = useSubscription();

const handleSubscribe = async () => {
  try {
    await createCheckoutSession();
    // User will be redirected to Stripe checkout
  } catch (error) {
    console.error("Subscription error:", error);
  }
};
```

## 🆘 Troubleshooting

### Common Issues

1. **Webhook not working**:

   - Check webhook URL is accessible
   - Verify webhook secret matches environment variable
   - Check Stripe dashboard for delivery attempts

2. **User still shows no access after payment**:

   - Check webhook events in Stripe dashboard
   - Verify database was updated with subscription
   - Check `stripe_subscription_id` matches

3. **Admin users being charged**:
   - Verify `is_admin` field in profiles table
   - Check API route blocks admin checkouts

### Debug Steps

1. Check browser network tab for API errors
2. Check server logs for webhook processing
3. Verify Stripe dashboard shows successful events
4. Check Supabase database for subscription records

---

**Need help?** Check the Stripe documentation or review the implementation in the codebase.
