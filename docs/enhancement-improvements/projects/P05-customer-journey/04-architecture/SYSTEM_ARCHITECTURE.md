# System Architecture — P05 Customer Journey & UX

## Current architecture (CONFIRMED)

```
Browser (Next.js client components)
  ├─ /checkout (checkout-content.tsx) ──┐
  ├─ /mycart step 2 (payment-stepper)   ├─ two independent implementations (REN-152)
  └─ profile checkout modal ────────────┘  (shares TRYNEW20 logic by copy-paste)
        │
        ├─ tRPC: orderIntent.createIntent      (creates ordersIntent row, pre-payment)
        ├─ Razorpay Checkout.js (client-side)  (captures payment — CLIENT SIDE, before any order exists)
        │     └─ handler callback (src/lib/razorpay/payment.ts)
        │           ├─ verifyPayment(payload)
        │           └─ for each brand-group: tRPC orders.createOrder  (catch-and-continue on failure)
        │
        └─ tRPC: orders.createOrder (server, src/lib/trpc/routes/general/orders.ts)
              ├─ protectedProcedure + ownership middleware
              ├─ for each line item: queries.orders.createOrder()   (no db.transaction)
              ├─ insert orderItems row
              └─ update ordersIntent.orderLog (progress marker, not a guard)

Independently, outside this call chain:
  Razorpay → webhook → src/app/api/webhooks/razorpay/{payments,refunds,subscriptions}/route.ts
              (internal reconciliation logic UNKNOWN — not traced in this pass)
```

## Architectural finding

There are **two writers into order state that are not coordinated**: the client-driven `handler` → `createOrder` path (fires once, right after capture, can partially fail) and the Razorpay webhook path (fires asynchronously, driven by Razorpay's own event delivery, purpose and reconciliation logic not verified in this pass). Neither is confirmed to be authoritative over the other. This is the structural root of REN-144 beyond just "missing transaction boundary" — even a transactional `createOrder` call fixes atomicity within one call, but does not by itself resolve which of the two paths is the source of truth if both attempt to finalize the same payment.

## Guest checkout architecture gap (REN-95)

Three independent layers currently assume an authenticated user and must change together (see `01-research/RESEARCH_SUMMARY.md` for citations): route-level redirect, tRPC procedure authorization, and the `orders.userId` NOT NULL foreign key. There is no existing "guest identity" concept anywhere in the schema or tRPC layer for this Epic to extend — REN-95's decisions (`07-decisions/DECISION_QUEUE.md`) include whether to introduce one (e.g., a synthetic guest user record, a nullable `userId` with a separate `guestEmail`/session-token column, or another mechanism).

## Consolidation target (REN-152, V1 scope)

The two checkout page implementations and the modal should converge on one shared "checkout engine" module (client-side order-detail assembly, coupon/tax/availability logic) consumed by three thin page/modal wrappers, rather than three independent copies. This is a refactor of existing logic, not new architecture — see `07-feasibility/BUILD_REUSE_BUY_SIMPLIFY.md`.
