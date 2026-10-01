# Stripe integration

Be.Vision uses Stripe-hosted Checkout for subscriptions, a 14-day card-on-file trial, Customer Portal for self-service billing, webhooks for Supabase synchronization, and Stripe Tax readiness.

## Required environment variables
STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, three recurring Price IDs, SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SITE_URL.

## Flow
POST /api/stripe/checkout with {priceId} -> Stripe Checkout -> webhook checkout.session.completed -> tenant billing state.
POST /api/stripe/portal -> Stripe Customer Portal.
Webhook events: checkout.session.completed, customer.subscription.updated, customer.subscription.deleted, invoice.paid, invoice.payment_failed.

Never expose STRIPE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY to the browser.