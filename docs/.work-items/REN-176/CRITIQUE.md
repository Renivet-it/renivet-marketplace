# Critique: REN-176

## Independent review

Fresh-context, read-only review of the REN-176 specification and repository evidence.

### REN176-CRIT-001 — DESIGN_BLOCKER

- Category: state/data consistency
- Finding: Review notes are required by the specification but the current `corporateQcSubmissions` schema has no review-notes field; reviewer timestamps are date-only.
- Evidence: `src/lib/db/schema/corporate-platform.ts:681-710`.
- Required action: Define an additive migration/field semantics for review notes and timestamp precision before READY_FOR_DEV.

### REN176-CRIT-002 — DESIGN_BLOCKER

- Category: security/authorization
- Finding: The issue wording conflicts on whether an approver must differ from the submitter.
- Evidence: REN-176 business problem says distinct reviewer; acceptance text says reviewer is not required to be the same user.
- Required action: Obtain owner confirmation and specify the allowed reviewer/submission role matrix.

### REN176-CRIT-003 — MAJOR

- Category: state/data consistency
- Finding: `submitQc` performs submission, image, document, and event writes separately, allowing partial evidence.
- Evidence: `src/lib/services/corporate-platform.ts:3620-3665`.
- Required action: Specify transaction or compensating rollback semantics for submission and review.

### REN176-CRIT-004 — MAJOR

- Category: integration/idempotency
- Finding: Retry-safe review event deduplication is unspecified; timeline/event writes have no evident unique idempotency key.
- Evidence: `createEvent` and corporate timeline schema in `corporate-platform.ts` and `src/lib/db/schema/corporate-platform.ts`.
- Required action: Define idempotency key/unique constraint and retry behavior.

### REN176-CRIT-005 — MAJOR

- Category: state transitions
- Finding: Multiple submissions per order are allowed, but latest-submission/revision semantics are undefined; an old approval could satisfy dispatch after a newer rejection.
- Evidence: `corporateQcSubmissions` has only an order index and no active/version constraint.
- Required action: Define one-active-submission or latest-version semantics and resubmission behavior.

### REN176-CRIT-006 — MAJOR

- Category: security
- Finding: Submit/review tenant and role rules are not explicit, and current submit service accepts arbitrary orderId without loading/scoping the order.
- Evidence: `src/lib/trpc/routes/general/corporate-platform.ts:182-186`, `corporate-platform.ts:3620+`.
- Required action: Add role matrix, order/brand scoping, and cross-tenant denial tests.

### REN176-CRIT-007 — MAJOR

- Category: privacy/integrity
- Finding: QC image URLs accept arbitrary values and evidence retrieval access controls are unspecified.
- Evidence: `corporatePlatformFileSchema` in `src/lib/validations/corporate-platform.ts:3-21`; QC images in `corporate-platform.ts:681-732`.
- Required action: Specify URL/content validation and authorized/signed evidence access.

### REN176-CRIT-008 — MINOR

- Category: observability
- Finding: Blocked-dispatch and review-conflict errors lack a deterministic reason taxonomy/correlation identifier.
- Evidence: Existing shared guard emits generic PRECONDITION_FAILED errors.
- Required action: Define structured reason codes and audit correlation metadata.

### REN176-CRIT-009 — MINOR

- Category: testability
- Finding: Existing status tests are primarily source-string checks; DB-backed race, rollback, revision, and evidence-access tests are not yet specified concretely.
- Evidence: `src/lib/services/corporate-status-guard.test.ts`.
- Required action: Add integration coverage for concurrency, rollback, revision semantics, and evidence authorization.

