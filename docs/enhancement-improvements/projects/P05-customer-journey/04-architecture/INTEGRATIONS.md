# Integrations — P05 Customer Journey & UX

## Razorpay (payment capture)
Client-side Checkout.js SDK, loaded dynamically in `checkout-content.tsx`. Payment capture is a Razorpay-side event that completes before Renivet's `handler` callback runs — Renivet does not control the capture/order-creation ordering without redesigning the flow (see BRule-1, DECISION REQUIRED). Razorpay also delivers webhooks (`src/app/api/webhooks/razorpay/{payments,refunds,subscriptions}/route.ts`) whose role relative to the client-driven path is UNKNOWN (not traced in this pass) — resolving this relationship is part of FR-1.5.

## Clerk (authentication)
`@clerk/nextjs/server`'s `auth()` is the source of truth for `userId` at both `checkout/page.tsx` and `mycart/page.tsx`. REN-95's guest-checkout work must decide how a guest identity coexists with Clerk's session model (e.g., no session at all vs. an anonymous/guest Clerk session) — DECISION REQUIRED, likely one of the 6 items in `07-decisions/DECISION_QUEUE.md`.

## Delhivery (fulfillment) — referenced, not owned here
Order fulfillment handoff happens after order creation and is out of this Epic's direct scope, but DEF-002 (shipment stuck "Active" after cancellation) is a downstream lifecycle defect on orders this Epic's flow creates — referenced in `08-reliability/FAILURE_MATRIX.md` as context, not remediated here.

## PostHog / Meta Pixel / WhatsApp (analytics and notifications)
`checkout-content.tsx` and `payment.ts` fire PostHog events, Meta Pixel/CAPI events, and WhatsApp order-confirmation notifications as side effects of order creation. These are best-effort (already wrapped in their own try/catch blocks that don't block the main flow) and are not part of the REN-144 integrity problem, but they do mean a "partial order" state still triggers customer-facing notifications (WhatsApp "your order is confirmed") that may not match the actual partial order set — an additional customer-trust angle worth noting for FR-1's fix design.

## Coupons service
`trpc.general.coupons.validateCoupon` and `getActiveCoupons` are shared across all three checkout surfaces already (not duplicated at the tRPC layer) — only the client-side auto-apply *trigger* logic (REN-161) is duplicated, not the underlying coupon validation service itself.
