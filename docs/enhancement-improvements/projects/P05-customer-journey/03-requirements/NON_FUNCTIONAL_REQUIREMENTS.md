# Non-Functional Requirements — P05 Customer Journey & UX

## NFR-1 — Data integrity (REN-144)
The probability of a captured payment having zero or partial corresponding orders must be reduced to effectively zero for new checkouts post-fix, and any occurrence must be detected within a bounded time window (target: minutes, not customer-report-driven) once FR-1.4's detection mechanism exists.

## NFR-2 — Auditability
Every order-creation attempt (success, partial failure, full failure) must leave a durable, queryable audit trail sufficient to answer "what happened to payment X" without ad hoc database inspection. This directly extends the existing but insufficient `ordersIntent.orderLog` mechanism (see FR-1.3).

## NFR-3 — Backward compatibility during REN-95 rollout
Authenticated checkout behavior must not regress while guest checkout is added — the existing `ctx.user.id === input.userId` authorization check is load-bearing and must remain intact for authenticated orders.

## NFR-4 — Performance
Adding transactional order creation (FR-1.2) must not materially increase checkout latency for the common case (single-brand, few-item cart) — target: no perceptible increase (<200ms added) for carts under 5 items from 1 brand. Multi-brand, multi-item carts may take proportionally longer if `db.transaction()` serializes writes, which is an acceptable and expected tradeoff for correctness.

## NFR-5 — Accessibility
The search modal fix (REN-110) and any new guest-checkout UI must meet the same accessibility bar as the rest of the site (Radix Dialog description/aria-describedby conventions already used elsewhere in the codebase).

## NFR-6 — Test coverage (cross-reference, not owned here)
REN-101 (zero automated test coverage on the payment/order path) is owned by the Security & Compliance Audit project, but any fix to REN-144 in this Epic should not ship without at least the specific regression tests needed to prove the transaction boundary and reconciliation behavior work — this is a minimum bar for this Epic's own changes, not a commitment to close REN-101's broader gap.

## NFR-7 — Consistency across duplicated surfaces during consolidation (REN-152)
Until FR-4's consolidation lands, any interim fix to one checkout surface (e.g., a REN-161 disclosure copy change) must be applied to all three duplicated surfaces to avoid introducing new inconsistency while removing old inconsistency.
