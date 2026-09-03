# REN-183 Critic Review

Independent fresh-context, read-only review of the REN-183 specification.

## Findings

### CRIT-001 — RESOLVED

User confirmation resolved DEC-001/DEC-002: only a `MANAGE_ORDERS` admin records the warehouse goods-received confirmation; receiver/date/quantity/warehouse are required, delivery reference is optional, and no GRN file upload is required.

### CRIT-002 — MAJOR

INV-001/REQ-005 need a transaction/locking design for the race between the guard reading an accepted GRN and a concurrent receipt correction or FO change. Without a version predicate or transaction boundary, a receipt could be revoked between validation and dispatch authorization.

### CRIT-003 — MAJOR

REQ-005/SCN-006 call for idempotent retry but do not define an idempotency key, unique request identity, or exact duplicate-review semantics. Duplicate receipt creation and retries need an explicit contract.

### CRIT-004 — MAJOR

“Current” and “stale” GRN semantics are undefined. The contract must state how FO reissue/cancellation/quantity changes affect a receipt and whether a receipt can expire; otherwise an old accepted receipt may authorize a changed FO.

### CRIT-005 — MAJOR

SCN-006 lacks a transition matrix for accepted→superseded, rejected→correction, concurrent acceptance, and whether quantity sufficiency is per single receipt or cumulative receipts.

### CRIT-006 — MAJOR

Migration requirements do not define deterministic treatment of any pre-existing receipt-like rows, index rollout, or rollback behavior. This must be resolved before schema rollout.

### CRIT-007 — MINOR

Observability/testability should specify mandatory receipt audit/event fields and metrics/logging for blocked transitions, receipt review, and provider failures. UI/API error codes and messages are also unspecified.

### CRIT-008 — MINOR

The Delhivery/manual integration needs an explicit atomicity boundary: provider failures must not advance status, and a status transition must not imply a provider-side pickup succeeded.

### Follow-up implementation constraints

The implementation must enforce the explicit permission/status matrix in the updated SPEC: server-side direct-mode checks for brand status updates, brand-scoped challan upload authorization, and admin-only warehouse receipt authorization. These are contract requirements, not blockers to the design.

## Category coverage

Requirements/scenarios: covered with the above implementation constraints. Failure/recovery: partial due to race, retry, and migration details that implementation must make explicit. Security/privacy: covered by the updated permission matrix. State/data consistency: partial pending the specified version/currentness and transition safeguards. Integrations/idempotency: partial pending concrete retry/provider atomicity implementation. Compatibility/migration: partial pending deterministic rollout details. Observability/testability: partial. Assumptions/dependencies: resolved for the agreed admin-only manual confirmation and no-file workflow.
