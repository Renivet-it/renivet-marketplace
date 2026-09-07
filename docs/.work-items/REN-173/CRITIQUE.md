# Critique: REN-173

## Result

`BLOCKED`. The independent fresh-context Critic reviewed the L3 draft read-only. The specification is not ready for `READY_FOR_DEV` because three design blockers remain: refund/stock side-effect ordering, exact carrier response/terminal-state allowlists, and conflict-safe JSONB evidence retention.

## Findings

### CRIT-173-001 — DESIGN_BLOCKER

Refund-before-carrier-cancel ordering is not reconciled with the no-duplicate-refund requirement. The customer path refunds in `src/lib/trpc/routes/general/orders.ts:1825-1862`; the order-ops helper refunds in `src/lib/support/cancel-order-helper.ts:43-76`, while carrier failures have different behavior. This conflicts with `REQ-173-005`, `REQ-173-008`, `REQ-173-011`, `INV-173-002`, `INV-173-004`, and `DEC-173-004`. Human confirmation is required for the financial/order-lifecycle policy before implementation.

### CRIT-173-002 — DESIGN_BLOCKER

The exact positive cancellation response and terminal-state allowlists are not finalized. `src/lib/delhivery/orders.ts:172-178` has no typed response contract, and the existing tracking map in `src/app/api/delhivery/cron/route.ts:14-26` does not define the required `Returned` behavior. `REQ-173-002`, `REQ-173-004`, `DEP-173-001`, and `DEC-173-003` require staging fixtures and explicit literal allowlists before production implementation.

### CRIT-173-003 — DESIGN_BLOCKER

The JSONB evidence design does not guarantee retention. The existing cron overwrites `orderShipments.delhiveryTrackingJson` with the latest tracking response around `src/app/api/delhivery/cron/route.ts:145-154`; the specification must define append/merge/version/concurrency/size-retention behavior for `REQ-173-003`, `REQ-173-012`, `INV-173-003`, and `INV-173-009`.

### CRIT-173-004 — MAJOR

The two cancellation callers have materially different aggregation and failure behavior. Customer cancellation fails on carrier failure, while `cancel-order-helper.ts:94-123` swallows carrier errors and still updates local shipment status. AWB versus `uploadWbn`, partial success, mixed Delhivery/Shiprocket shipments, and caller races need explicit rules under `REQ-173-006`, `SCN-173-002`, and `REQ-173-013`.

### CRIT-173-005 — MAJOR

Cron reconciliation is not concretely idempotent or concurrency-safe. The existing cron excludes locally cancelled shipments, no pending-cancellation selector or durable attempt marker is specified, and alert creation is a read-then-insert sequence. This affects `REQ-173-007`, `REQ-173-008`, `REQ-173-013`, and `INV-173-004`.

### CRIT-173-006 — MAJOR

Alert discoverability and operator action are under-specified. `createOperationalAlert` defaults to admin channels, the monitoring surface gates by monitoring permissions, and `ownerRole` alone does not prove order-manager access or an actionable destination. This affects `REQ-173-007`, `REQ-173-015`, `INV-173-005`, `INV-173-012`, `INT-173-003`, and `DEP-173-007`.

### CRIT-173-007 — MAJOR

Existing raw-response logging conflicts with the privacy boundary: `src/app/api/delhivery/cron/route.ts:103-111` logs a raw response prefix and the route returns `String(err)` on failure. `SEC-173-003`, `REQ-173-009`, `REQ-173-014`, `INV-173-007`, and `INV-173-011` require explicit redaction and safe error-boundary rules.

## Category assessment

- Requirements/scenarios: FAIL
- Failure/recovery: FAIL
- Security/privacy: FAIL
- State/data consistency: FAIL
- Integrations/idempotency: FAIL
- Compatibility/migration: PARTIAL
- Observability/testability: FAIL
- Assumptions/dependencies: FAIL

No application test suites were run and no repository files were modified by the Critic.

## Re-review after product decision

The product decision resolved `CRIT-173-001` at the contract level: Delhivery cancellation and terminal verification must precede local shipment/order cancellation, refund, and stock restoration. The re-review confirmed that implementation has not begun and therefore did not treat the decision as implemented behavior.

The remaining blockers are `CRIT-173-002` (exact Delhivery positive-response and terminal-state fixtures) and `CRIT-173-003` (conflict-safe JSONB evidence retention). `CRIT-173-004` through `CRIT-173-008` remain major implementation-contract findings. The re-review concluded that `READY_FOR_DEV` is not justified yet.
