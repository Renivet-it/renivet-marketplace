# Algorithm Evaluation — P05 Customer Journey & UX

## Current success-criterion algorithm (REN-144) — evaluated

**Correctness**: Fails. `createdOrders.length > 0` is a liveness check ("something happened"), not a correctness check ("everything the customer paid for happened"). For any cart with more than one order-creation unit (brand or, per this research, line item), this criterion is wrong by construction — it cannot distinguish full success from partial success.

**Why it likely exists this way**: plausibly a defensive choice to avoid blocking the entire checkout on one bad brand/item (reasonable intent — don't let one bad SKU ruin an otherwise-good multi-brand order) implemented in a way that hides the failure instead of surfacing it. The target algorithm (05-algorithms/TARGET_ALGORITHM.md) should preserve resilience to genuinely one-off issues (via bounded retry) without silently degrading correctness guarantees.

**Evaluated alternative — "best effort, then reconcile"**: keep catch-and-continue for resilience, but pair it with FR-1.3/FR-1.4's durable reconciliation record so a partial outcome is *detected and repaired* rather than hidden. This is the direction taken in `10-roadmap/V1.md` because a hard all-or-nothing transaction across external calls (WhatsApp, stock deduction) is harder to guarantee than atomicity across the database writes specifically — the transaction boundary (FR-1.2) should cover the order/orderItems writes; the "tell the customer accurately" fix (FR-1.2 success criterion) is a smaller, purely-logical change that should ship regardless of how far the transactional hardening goes.

## Current guest-redirect algorithm (REN-111) — evaluated

**Consistency**: Fails by construction — two independently authored rules for the same conceptual decision ("what does a guest see here") will drift further apart over time as each surface is edited independently. This is the same class of risk as REN-152's duplicated checkout logic, just applied to authorization rather than business logic.

## Current TRYNEW20 trigger algorithm (REN-161) — evaluated

**Honesty**: Cannot be fully evaluated without the server-side rule (UNKNOWN). If the server-side rule matches the client trigger (any customer, threshold-only), the current algorithm is *internally consistent* but *externally misleading* given the coupon's naming — a copy fix suffices. If the server-side rule is genuinely new-customer-gated and the client trigger is just a UI shortcut that gets rejected server-side for existing customers, the current algorithm produces a worse UX (a customer sees a coupon "apply" client-side then silently fail eligibility) — this determines which of FR-5.2's two remediation paths applies, making FR-5.1 a hard prerequisite, not an optional step.
