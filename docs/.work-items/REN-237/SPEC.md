# REN-237 — Return/RTO Fault Attribution & Review

## Scope and outcome

Extend the existing `return-replace` admin review modal and backend so attribution is an explicit reviewer decision. Customer-selected reason and uploaded evidence remain advisory inputs only. Customer return/refund cases write `refunds.costAllocation` and the synchronized `refunds.policyBucket`; carrier-initiated RTO cases write `rto_dispositions.faultOwner`. REN-236 must consume these persisted values and must not infer fault independently.

The implementation must remove the current keyword-only financial inference in `src/lib/trpc/routes/general/returnReplace.ts` for new return creation/approval, leaving the case pending/unattributed until a reviewer explicitly saves attribution.

## Requirements

- REQ-237-001: Display customer reason, evidence, current attribution, and linked shipment/RTO disposition context in the existing `ReturnReplaceDetailsModal`.
- REQ-237-002: Provide an explicit reviewer attribution action separate from Approve/Reject, using the existing return and RTO enums without creating a third taxonomy.
- REQ-237-003: For customer returns, persist `costAllocation` and `policyBucket` together; for genuine carrier RTO cases, persist `rto_dispositions.faultOwner` through the existing disposition capability.
- REQ-237-004: Reclassification requires notes and is rejected when the order's case is present in an approved, processing, or completed payout cycle.
- REQ-237-005: Persist attribution history with actor, timestamp, previous value, and new value using the existing finance audit mechanism.
- REQ-237-006: Preserve the existing evidence upload/storage/display flow and show a distinct unavailable-image state when an evidence URL fails to load.
- REQ-237-007: Enforce `refunds` view/manage access for refund attribution and retain `MANAGE_ORDERS` authorization for RTO disposition mutation.
- REQ-237-008: Do not let customer reason alone create a brand-chargeable attribution; no attribution remains pending until explicit reviewer action.
- REQ-237-009: Keep return request approval/rejection separate from attribution confirmation and preserve prior persisted values when attribution save fails.
- REQ-237-010: Provide the final persisted attribution shape for REN-236 consumption without implementing BIZ-14 fee/allocation logic in this ticket.

## Scenarios

- SCN-237-001: A pending return shows customer reason/evidence and an unset attribution; no brand deduction is created before review. (REQ-237-001, REQ-237-008)
- SCN-237-002: A reviewer confirms the suggested attribution or selects a different valid return attribution explicitly. (REQ-237-002, REQ-237-003)
- SCN-237-003: A reviewer reclassifies an already-attributed return with required notes before payout lock. (REQ-237-004, REQ-237-005)
- SCN-237-004: Reclassification after approved-or-later payout inclusion is rejected and leaves all attribution fields unchanged. (REQ-237-004, REQ-237-009)
- SCN-237-005: A carrier RTO case shows an existing disposition and writes only its authoritative `faultOwner`. (REQ-237-001, REQ-237-003, REQ-237-010)
- SCN-237-006: A return with no RTO disposition shows no fabricated RTO data. (REQ-237-001)
- SCN-237-007: Missing evidence and broken evidence URLs remain understandable and do not disable attribution review. (REQ-237-006)
- SCN-237-008: View-only users can inspect attribution but cannot save; unauthorized users are denied the review surface. (REQ-237-007)
- SCN-237-009: Attribution mutation failure shows an inline error and retains the prior saved value. (REQ-237-009)
- SCN-237-010: Approval/rejection and attribution are independent actions and produce separate state transitions/audit evidence. (REQ-237-005, REQ-237-009)

## Invariants

- INV-237-001: Customer reason and evidence never directly determine a financial attribution.
- INV-237-002: Customer return attribution always keeps `costAllocation` and `policyBucket` equal.
- INV-237-003: RTO attribution uses `rto_dispositions.faultOwner`; it is not copied into refund fields.
- INV-237-004: Approved-or-later payout inclusion makes attribution immutable through this workflow.
- INV-237-005: Attribution writes are explicit, auditable, and distinguishable from customer-selected reason.
- INV-237-006: No evidence or unavailable evidence never causes the UI to crash or invent evidence/disposition data.
- INV-237-007: Authorization is enforced server-side on every read and mutation path.

## Flows and architecture

- FLOW-237-001: Existing return-replace list → existing detail modal → read-only case context → explicit attribution action → refresh attribution/history.
- FLOW-237-002: Customer return attribution → `refunds` update transaction → synchronized `policyBucket` → finance audit event.
- FLOW-237-003: Carrier RTO attribution → existing `order-ops` disposition mutation → `faultOwner`/actor/timestamp → audit evidence.
- FLOW-237-004: Attribution mutation → payout-cycle inclusion lookup → reject if cycle status is approved/processing/completed; otherwise write atomically.
- FLOW-237-005: Evidence URL load failure → per-image unavailable placeholder; no change to UploadThing or stored evidence keys.

## Dependencies and integrations

- DEP-237-001: Existing `order_return_requests` and `ReturnReplaceDetailsModal`.
- DEP-237-002: Existing `refunds.costAllocation`, `refunds.policyBucket`, refund policy helpers, and finance refund queries.
- DEP-237-003: Existing `rto_dispositions` and `order-ops.upsertRtoDisposition`.
- DEP-237-004: Existing payout cycles and `brand_payout_line_items` for lifecycle locking.
- DEP-237-005: Existing `audit_logs`/`writeFinanceAuditEvent`.
- DEP-237-006: REN-236 consumer contract; REN-236 must read final persisted attribution and implement no duplicate inference.

- INT-237-001: tRPC return/finance/order-ops routes; authorization and validation errors remain visible.
- INT-237-002: Database transaction/update ordering; partial synchronization is not allowed.
- INT-237-003: REN-236 payout fee allocation reads persisted `faultOwner`/return attribution only.
- INT-237-004: Existing UploadThing-backed evidence URLs; broken delivery is represented, not silently hidden.

## Personas and security

- PER-237-001: Refunds manager/admin can inspect and mutate customer-return attribution.
- PER-237-002: Refunds viewer can inspect attribution/history only.
- PER-237-003: Order-operations manager can perform the existing RTO disposition mutation.
- PER-237-004: Unauthorized user has no review access.

- SEC-237-001: `assertFinanceAccess(ctx, "refunds", "view|manage")` protects refund review paths.
- SEC-237-002: Existing `MANAGE_ORDERS` check remains authoritative for RTO disposition writes.
- SEC-237-003: Attribution and audit data are never exposed through customer-facing routes beyond existing customer request behavior.

## Business rules

- BR-237-001: Customer-selected reason is a suggestion/evidence input, never an adjudication.
- BR-237-002: Return fault values are `brand_fault`, `customer_fault`, `renivet_fault`, `carrier_fault`.
- BR-237-003: RTO owner values are `customer`, `carrier`, `brand`, `renivet`, `unknown`.
- BR-237-004: Attribution lock begins at payout cycle status `approved`, not only `completed`.
- BR-237-005: Post-settlement correction is out of scope; locked changes fail closed.

## Decisions

- DEC-237-001 (AUTO_DECIDE): Extend the existing return-replace modal/page rather than creating a parallel review surface; required by the latest Linear UI specification and repository conventions.
- DEC-237-002 (AUTO_DECIDE): Use existing enums and helpers; do not create a bridge taxonomy.
- DEC-237-003 (RESOLVED): Customer returns use `costAllocation` + synchronized `policyBucket`; carrier RTOs use `faultOwner`.
- DEC-237-004 (RESOLVED): Lock attribution after approved-or-later payout inclusion; no correction mechanism in this ticket.
- DEC-237-005 (RESOLVED): Use `refunds` finance module access for refund attribution and existing `MANAGE_ORDERS` for RTO disposition.

## Test expectations

- TEXP-237-001 (unit, REQUIRED): Existing reason helpers, notes-required rules, taxonomy mapping, and evidence-state rendering logic are deterministic.
- TEXP-237-002 (api, REQUIRED): Attribution authorization, explicit-only writes, enum validation, and failure preservation are protected.
- TEXP-237-003 (integration, REQUIRED): Return updates synchronize cost allocation/policy bucket atomically and emit audit history.
- TEXP-237-004 (integration, REQUIRED): Payout lifecycle lookup rejects attribution after approved-or-later inclusion and permits pre-lock changes.
- TEXP-237-005 (integration, REQUIRED): RTO disposition writes preserve existing authorization and expose final faultOwner for REN-236.
- TEXP-237-006 (component, REQUIRED): Modal distinguishes customer reason, final attribution, current RTO disposition, permissions, missing evidence, broken images, loading, success, and failure.
- TEXP-237-007 (regression, REQUIRED): Existing return/replacement approval, rejection, evidence upload/display, refund policy, payout deduction, and order-ops behavior remain intact.

## Traceability

Every requirement is covered by at least one scenario above; scenarios map to the invariant and test expectation with the same numeric suffix. The critic artifact records repository evidence and remediation findings before implementation.
