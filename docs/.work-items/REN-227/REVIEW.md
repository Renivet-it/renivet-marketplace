# REVIEW: REN-227 — [FCCP][P1] Investigate & Fix Customer Invoice-Availability Gap (BIZ-18)

## Executive Result

`REVIEW_PASSED_WITH_FINDINGS` with `MINOR_DRIFT`; governance re-entry is not required. The implementation keeps the approved `orders.invoice_number` field, adds a delivery-triggered writer for both payment methods, preserves the customer download route, and surfaces the reference in the admin orders table. Controlled staging evidence and a database-backed concurrency test remain required before production clearance.

Comparison base: `origin/master` at `1f60fefa5cd7edca3c433aba04cb43e488cdbf11`. Current implementation is uncommitted, so the review head commit is the same base commit and the working-tree diff is explicitly included below.

## Review Scope and Git Evidence

- Work item: `REN-227`; approved local contract is `docs/.work-items/REN-227/work-item.yaml`.
- Changed implementation paths: `src/lib/order-invoice.ts`, `src/lib/invoice-availability.ts`, `src/app/api/delhivery/invoice/route.tsx`, `src/app/api/webhooks/shipping/route.ts`, `src/components/dashboard/general/orders/orders-table.tsx`.
- Test path: `src/lib/invoice-availability.test.ts`.
- Existing customer reader inspected: `src/app/api/invoices/[orderId]/download/route.tsx`; it was not changed.
- Existing admin reader inspected: `src/components/dashboard/general/orders/orders-table.tsx`; invoice reference is now displayed with a safe unavailable state.

## Requirement Reconciliation

- `REQ-227-001`: PASS. Existing Delhivery writer was traced and extracted; Shiprocket delivery webhook is now the additional trigger.
- `REQ-227-002`: PASS for the implemented delivery path. The shared allocator persists `orders.invoice_number` after delivery for prepaid and COD orders.
- `REQ-227-003`: PARTIAL. Delivery is the approved eligibility trigger, but a controlled staging matrix still needs to prove cancelled/unpaid non-delivered orders remain unissued.
- `REQ-227-004`: PASS by direct code evidence. The transaction locks the order row, returns an existing number, uses the unique sequence constraint, and never overwrites a populated value.
- `REQ-227-005`: PASS for bounded in-request retry and alerting; durable post-process retry evidence is still a staging validation item.
- `REQ-227-006`: PASS by unchanged customer route and added admin table column.
- `REQ-227-007`: PASS. No migration, backfill, second download route, format rewrite, or corporate-document change was introduced.
- `REQ-227-008`: PARTIAL. Focused tests exist, but controlled post-fix population evidence is not available in this uncommitted local review.

## Scenario Reconciliation

- `SCN-227-001`: PASS (trace recorded in SPEC and shared allocator diff).
- `SCN-227-002`, `SCN-227-003`: PARTIAL; delivery trigger and carrier-independent allocator are present, but runtime Delhivery/Shiprocket validation is pending.
- `SCN-227-004`: PARTIAL; no non-delivered trigger was added, but the approved matrix needs runtime confirmation.
- `SCN-227-005`: PARTIAL; row lock and unique sequence are present, but concurrent database execution is pending.
- `SCN-227-006`: PASS for bounded retry and deduplicated operational alert code; runtime alert delivery remains to be checked.
- `SCN-227-007`: PASS by reader inspection and admin column addition; authorized customer download remains unchanged.
- `SCN-227-008`: PASS by diff scope.
- `SCN-227-009`: PARTIAL; aggregate controlled evidence is still required.

## Invariant Reconciliation

- `INV-227-001`, `INV-227-002`, `INV-227-003`, `INV-227-004`, and `INV-227-005`: PASS by implementation and unchanged route inspection.
- `INV-227-006`: PASS; logs and alerts include order ID, attempts, and error text only, with no customer/payment/bank/GSTIN payload.

## Flow and Architecture Review

The shared allocator centralizes the existing Delhivery persistence behavior. The delivery webhook updates the order to delivered, selects an available item brand, retries allocation, and records a deduplicated critical alert on exhaustion. The existing customer route remains the only download route. The admin table reads the same persisted order field. This is compatible with the approved delivery-triggered architecture and does not require a schema migration.

## Security and Integration Review

Customer download authorization remains in `src/app/api/invoices/[orderId]/download/route.tsx` and was not weakened. The invoice writer remains behind the existing logistics access check. The allocator uses a row lock and existing uniqueness constraints. Carrier webhook failure does not falsely claim invoice issuance; invoice failure is logged and alert creation is isolated from the shipment response path.

## Scope and Drift Review

No material drift observed. The only minor implementation variation is bounded retry in the webhook request rather than a separate asynchronous job, which is within the approved decision to use a delivery-triggered retryable path. No historical records are touched.

## Test Expectation Review

- `TEXP-227-001`: PASS by repository trace evidence.
- `TEXP-227-002`, `TEXP-227-003`, `TEXP-227-004`, `TEXP-227-005`, `TEXP-227-006`: PARTIAL. `src/lib/invoice-availability.test.ts` covers retry success and exhausted failure alert callback; database-backed delivery, uniqueness, customer download, admin rendering, and controlled population tests remain required.

## Findings

### REV-001

- Severity: MEDIUM
- Category: test
- Description: Controlled staging evidence and database-backed concurrency/eligibility tests are not present in this local review.
- Evidence: `TEXP-227-002` through `TEXP-227-006`; implementation files listed in Review Scope; repository-wide `bun test` also reports unrelated existing failures.
- Impact: The code path is covered structurally, but production readiness cannot yet be demonstrated for real carrier delivery events, duplicate callbacks, and aggregate population.
- Recommendation: Run the approved staging matrix with one prepaid and one COD delivery, duplicate each delivery callback, verify one persisted number and customer/admin availability, and record redacted aggregate evidence in the PR/Linear issue.

## Decisions Requiring Attention

None. Approved decisions are reflected in the local contract.

## Final Recommendation

Keep the implementation on the feature branch. Before production clearance, complete `REV-001` with controlled staging evidence and a database-backed concurrency check. The local governance contract remains approved and valid; no migration or historical backfill is required for this change.
