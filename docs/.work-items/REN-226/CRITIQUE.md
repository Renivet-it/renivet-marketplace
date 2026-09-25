# REN-226 — Independent Critic Review

Review mode: fresh-context, read-only repository review.

## Findings

### CRIT-226-001 — MAJOR — natural-key coverage must support split payments

The existing `refunds.payment_id` uniqueness and finance `getRefundByOrderId` helper are not sufficient as a universal idempotency contract: one order can have multiple payment/refund events. The implementation must select a gateway refund identifier when available and must not deduplicate all events only by order ID. Covered by REQ-226-004, REQ-226-009, SCN-226-004, SCN-226-005, and INV-226-004.

### CRIT-226-002 — MAJOR — ordering must include side effects and transaction boundaries

The current Razorpay processed path updates order and refund independently in `Promise.all`, and notifications/analytics/reward actions follow. The canonical path must make durable refund/event state and derived order status atomic before side effects, and repeated side effects must be deduplicated or guarded. Covered by REQ-226-001, REQ-226-002, SCN-226-001, SCN-226-011, and INV-226-008.

### CRIT-226-003 — MINOR — reconciliation must be report-only for historical uncertainty

The two named cases have an explicit production-safety gate. The spec therefore requires a read-only report and issue-recorded outcome, while leaving any correction to a separate approval. Covered by REQ-226-007, SCN-226-008, INV-226-005, and DEC-226-004.

### CRIT-226-004 — MINOR — operational alert behavior needs bounded dedupe

An ongoing check without a stable dedupe key could create repeated finance alerts. The contract now requires repository-style deduplication and later resolution evidence. Covered by REQ-226-006 and SCN-226-007.

## Category attestations

- Requirements/scenarios: reviewed; the split-payment, replay, failure, and historical-data cases are explicit.
- Failure/recovery: reviewed; transaction failure, gateway failure, replay, and partial completion are covered.
- Authentication/security/privacy: reviewed; webhook signatures, finance/admin authorization, secrets, and output minimization are bounded.
- State/data consistency: reviewed; refund row precedes derived status and reconciliation is non-mutating.
- Integrations/idempotency: reviewed; Razorpay retries, multiple payment identifiers, and side-effect dedupe are explicit.
- Compatibility/migration: reviewed; existing statuses and downstream rules are preserved; any index change requires preflight/recovery.
- Observability/testability: reviewed; reconciliation alerts, audit evidence, deterministic tests, and UAT are required.
- Assumptions/dependencies: reviewed; production evidence for two named orders and separate approval for correction remain explicit.

No design blocker remains after these findings were incorporated into SPEC.md and work-item.yaml.
