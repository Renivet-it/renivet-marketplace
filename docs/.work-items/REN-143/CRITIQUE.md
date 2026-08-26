# REN-143 Independent Critic Review

Reviewer: `independent_codex_critic`  
Attestation: fresh context, repository read-only, no files or external state modified, no application tests run  
Reviewed baseline: `26914e7c0f5b04b60b4e457b45f0100a9367f7e7`  
Verdict: `BLOCKED`

The Critic ignored the prior `CRITIQUE.md`, fetched REN-143 and its empty comment set, and reviewed the current branch, specification, machine contract, and repository evidence.

## Findings and dispositions

### CRIT-001 — DESIGN_BLOCKER — Resolved in contract

The provider scope omitted Razorpay refunds and legacy Shiprocket cancellation reachable from required staging cancellation/return journeys while `REQ-015` otherwise implied an unbounded cross-provider redesign. Evidence: `src/lib/trpc/routes/general/returnReplace.ts:613-642,707-725`, `src/lib/trpc/routes/general/orders.ts:1790-1889`, `src/lib/support/cancel-order-helper.ts:43-110`, and `src/lib/finance/refunds.ts:625-664`.

Disposition: `REQ-003`, `REQ-007`, `REQ-014`, `SCN-019`, `FLOW-007`, `INT-008`, `TEXP-004`, `TEXP-007`, and `TEXP-018` now define an authoritative required-journey inventory, cover the additional mutable providers, and explicitly exclude unrelated bulk marketing operations.

### CRIT-002 — DESIGN_BLOCKER — Resolved in contract

`GET /api/delhivery/cron` lacked authentication/environment denial, called Delhivery, mutated shipment/order/reward state, sent WhatsApp, and logged a credential-bearing URL. Evidence: `src/app/api/delhivery/cron/route.ts:58-100,144-225`.

Disposition: `REQ-007`, `REQ-014`, `SCN-018`, `INV-012`, `FLOW-008`, `SEC-009`, and `TEXP-017` require timing-safe cron authentication, staging disable/isolation, controlled provider boundaries, absent/wrong/shared-secret tests, and redacted logging.

### CRIT-003 — DESIGN_BLOCKER — Resolved in contract

The earlier `external_suppressed` proposal overloaded `order_return_requests.status`, which represents adjudication/workflow (`pending`, `approved`, `rejected`, `processing`, `completed`), and would have lost the prior approved state. Evidence: `src/lib/db/schema/order-shipment.ts:121-136` and `src/lib/trpc/routes/general/returnReplace.ts:727-734,858-862`.

Disposition: `REQ-005`, `SCN-007`, `BR-006`, `DEC-009`, and `TEXP-015` now preserve existing business status, create no provider row/identifier on skip, authorize no schema/status migration, and require governance re-entry if implementation proves persistence changes necessary.

### CRIT-004 — DESIGN_BLOCKER — Resolved in contract

The draft omitted the live Meta Pixel fallback and Clerk OTP behavior required by the signup/analytics acceptance matrix. Evidence: `src/lib/fbpixel.ts:1-2`, `src/app/layout.tsx:138-171`, and `src/components/auth/phone-first-sign-up.tsx:76-123`.

Disposition: `REQ-007`, `REQ-014`, `SCN-010`, `INT-005`, `INT-009`, and `TEXP-018` require no live Pixel fallback in non-production, distinct/disabled analytics destinations, and a bounded synthetic Clerk test using an approved owned recipient with cost evidence.

### CRIT-005 — DESIGN_BLOCKER — Preserved

Production/staging `APP_ENV`, production policy seed/owner, resource isolation, feature-branch workflow reliance, and the project-specific Phase B Vercel control/metric remain unknown.

Disposition: preserved in `DEP-001` through `DEP-007`, `DEC-005` through `DEC-008`, and `approval.design_blockers`. The contract remains `BLOCKED`.

### CRIT-006 — DESIGN_BLOCKER — Resolved in contract; decision remains open

The generic provider-operation ledger, reconciliation workflow, webhook inbox/outbox, and related migrations were a significant architectural trade-off misclassified as `RECOMMEND_CONTINUE`.

Disposition: the generic architecture and webhook behavior redesign were removed. `REQ-015`, `BR-008`, and `DEC-011` make production-denial recovery operation-specific and `HUMAN_CONFIRMATION`; the decision itself remains an approval blocker.

### CRIT-007 — MAJOR — Resolved in contract

The prior status/ledger/inbox migrations lacked additive DDL, mixed-version behavior, and rollback data handling. Evidence: current status definitions in `src/lib/db/schema/order-shipment.ts:51-71,121-136` and cron selection in `src/app/api/delhivery/cron/route.ts:62-76`.

Disposition: no schema/status migration is authorized. `BR-006`, `BR-008`, `DEC-009`, `TEXP-015`, and the rollback plan require the narrowest fail-closed revision to survive rollback and require governance re-entry for schema changes.

### CRIT-008 — MAJOR — Resolved in contract

The generic idempotency record did not define atomic winner/loser behavior, leases, crash recovery, or retention across competing cancellation callers. Evidence: `src/lib/trpc/routes/general/orders.ts:1747-1905` and `src/lib/support/cancel-order-helper.ts:10-124`.

Disposition: the generic ledger/idempotency redesign was removed from REN-143. Existing provider semantics remain unchanged; operation-specific production-denial recovery requires `DEC-011` approval.

### CRIT-009 — MAJOR — Resolved in contract

The asserted monotonic webhook map had no transition table even though delivery, cancellation, failure, and RTO branch rather than form a total order. Evidence: `src/app/api/webhooks/shipping/route.ts:46-62,160-174`.

Disposition: REN-143 no longer changes webhook ordering/idempotency. `REQ-007`, `SCN-009`, `INV-012`, and `SEC-009` limit webhook work to environment ownership, secret isolation, and fail-closed outbound effects; product-state redesign is a separate follow-up.

### CRIT-010 — MAJOR — Partially resolved; blocker preserved

Policy reads and `createOperationalAlert` both depend on the database, a missing Delhivery token throws at module import, and production-denied post-commit effects lacked a recovery policy. Evidence: `src/lib/external-side-effects.ts:17-25`, `src/lib/monitoring-sla/audit.ts:41-56`, and `src/lib/delhivery/client.ts:4-13`.

Disposition: `REQ-016`, the architecture, and `TEXP-019` require independent structured-log fallback, non-throwing alert failure, and lazy provider initialization after authorization. Recovery remains the unresolved Class C `DEC-011` blocker.

### CRIT-011 — MINOR — Resolved in contract

`TEXP-013` and `TEXP-014` had no scenario traceability.

Disposition: both now map to `SCN-017`, covering accessible fail-closed copy, read-only state, permission feedback, and policy-write rejection.

### CRIT-012 — MINOR — Resolved in contract

The draft incorrectly said the browser-marked Razorpay module directly imported database policy. Current evidence shows it imports the server action, while the policy import is in `src/actions/whatsapp/send-order-notification.ts:28-31`.

Disposition: `SPEC.md` now states the correct evidence and requires enforcement at the lowest server-side WhatsApp boundary without a browser database-policy import.

## Required category coverage

- `requirements_scenarios`: CRIT-001, CRIT-002, CRIT-004, CRIT-011.
- `failure_recovery`: CRIT-007, CRIT-008, CRIT-010.
- `security_privacy`: CRIT-002, CRIT-004, CRIT-010.
- `state_data_consistency`: CRIT-003, CRIT-007, CRIT-009.
- `integrations_idempotency`: CRIT-001, CRIT-008, CRIT-009.
- `compatibility_migration`: CRIT-007.
- `observability_testability`: CRIT-002, CRIT-010, CRIT-011.
- `assumptions_dependencies`: CRIT-005, CRIT-006.

## Final Critic position

The supported design findings have been reconciled without authorizing the prior scope-expanding schema/ledger/webhook redesign. External facts in `DEC-005` through `DEC-008` and the high-consequence recovery choice in `DEC-011` remain unresolved. The approval gate must stay fail closed and the work item must not emit `READY_FOR_DEV`.
