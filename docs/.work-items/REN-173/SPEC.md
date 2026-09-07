# REN-173 — Delhivery shipment cancellation reconciliation

## Decision

`READY_FOR_DEV` is the target decision after the independent L3 Critic confirms that the cancellation, verification, persistence, and alerting contract is complete. This specification does not implement application code, schemas, migrations, or tests.

## Objective

Prevent a customer- or operator-cancelled Delhivery shipment from being treated as successfully cancelled when the carrier remains active, and make every divergence visible through existing operational alerting.

## Evidence and current state

- Linear REN-173 is an urgent, release-blocking QA finding: AWB `34816410001083` remained active after Renivet marked the order cancelled.
- `src/lib/delhivery/orders.ts:172-178` currently posts `{ waybill, action: "cancel" }` to `/api/p/edit`; Delhivery's cancellation contract documents `{ waybill, cancellation: "true" }`.
- `src/lib/trpc/routes/general/orders.ts:1884-1909` treats any response without a failure/error string as success, then `src/lib/trpc/routes/general/orders.ts:1928-1933` marks the shipment cancelled.
- `src/lib/support/cancel-order-helper.ts:79-115` is a second cancellation path that currently ignores carrier response semantics and still marks the local shipment cancelled.
- `src/app/api/delhivery/cron/route.ts:66-166` polls active shipments, stores the latest tracking JSON, and excludes locally cancelled shipments; it is therefore unable to reconcile a cancellation divergence after local status changes.
- `orderShipments.delhiveryTrackingJson` already exists as JSONB and `createOperationalAlert` already writes deduplicated admin-visible alerts through the monitoring SLA system.
- Delhivery's public cancellation documentation states that cancellation is allowed only for selected lifecycle states and that prepaid/COD packages may become `Returned`, while pickup packages may become `Cancelled`. The public tracking documentation exposes `/api/v1/packages/json` for follow-up status reads. Exact positive response fixtures must be captured from the configured staging account before production rollout.

## Scope

In scope:

- Correct the Delhivery cancellation request contract.
- Centralize explicit response classification and follow-up carrier-status verification for both customer and order-ops cancellation paths.
- Persist the raw cancellation and verification responses in the existing shipment JSON audit field without introducing a schema migration.
- Keep local shipment/order cancellation from being treated as reconciled until the carrier returns an accepted cancellation terminal state.
- Extend the existing protected Delhivery polling/reconciliation route to discover pending/divergent cancellations and create deduplicated operational alerts.
- Add unit, integration/static regression, and staging-only end-to-end test expectations.

Out of scope:

- Replacing Delhivery, Shiprocket, Razorpay, or the order-status model.
- New database tables, migrations, carrier webhooks, or a new dashboard surface.
- Automatic refunds, stock policy, or payment-success behavior unrelated to carrier cancellation gating.
- Treating an unknown carrier response as success or silently forcing local cancellation.

## Risk assessment

- Initial risk: `L2` — contained but cross-cutting payment/order cancellation behavior.
- Path-rule risk: `L3` — external carrier integration, order lifecycle, fulfillment state, refund interaction, and release-blocking operational recovery.
- Semantic risk: `L3` — a false positive can authorize fulfillment of a cancelled order; a false negative can strand refunds and require operator recovery.
- Final risk: `L3`.

## Requirements

- `REQ-173-001`: Send the documented Delhivery cancellation payload using `waybill` and `cancellation: "true"`.
- `REQ-173-002`: Classify cancellation responses fail-closed; only an explicit documented positive response may be accepted.
- `REQ-173-003`: Persist the raw cancellation response, request metadata, outcome, and follow-up tracking response in `delhiveryTrackingJson` before applying local status changes.
- `REQ-173-004`: Verify the carrier status after a positive cancellation response and recognize the documented terminal cancellation states, including `Cancelled` and `Returned` where applicable.
- `REQ-173-005`: Do not mark a shipment or order cancelled/reconciled when cancellation or verification fails, is ambiguous, or reports an active/non-terminal carrier state.
- `REQ-173-006`: Apply the same contract to customer cancellation and the order-ops/helper cancellation path.
- `REQ-173-007`: Reconcile pending/divergent cancellation attempts through the existing authenticated Delhivery polling route and raise a deduplicated operational alert visible to order managers.
- `REQ-173-008`: Preserve idempotency: repeated reconciliation must not duplicate alerts, refunds, stock restoration, or terminal state transitions.
- `REQ-173-009`: Keep carrier tokens server-side, avoid raw carrier payloads in logs, and retain only the existing server-side JSON audit boundary.
- `REQ-173-010`: Keep unrelated shipment tracking, successful payment, Shiprocket, and non-cancellation order flows unchanged.
- `REQ-173-011`: Resolve the ordering of refunds/stock restoration versus carrier cancellation before changing cancellation side effects; no implementation may silently choose a new financial policy.
- `REQ-173-012`: Define versioned merge/append semantics, write-failure behavior, and bounded retention for cancellation evidence so ordinary tracking cannot erase it.
- `REQ-173-013`: Define a durable attempt identity and concurrency/claim behavior for multiple tracking IDs, mixed shipments, and overlapping customer/operator/reconciliation runs.
- `REQ-173-014`: Redact carrier/customer-sensitive data from logs and return only safe generic errors from reconciliation endpoints.
- `REQ-173-015`: Define alert severity, metadata, access, dedupe, and recovery action so an order manager can discover and act on a divergence.

## Scenarios

- `SCN-173-001`: Customer cancellation sends the documented payload, receives an explicit positive response, verifies a carrier terminal cancellation state, persists evidence, and then completes local cancellation.
- `SCN-173-002`: Order-ops cancellation uses the same shared cancellation/verification contract and does not silently mark local shipment cancelled on carrier failure.
- `SCN-173-003`: Missing, malformed, failure, or unknown cancellation responses fail closed, persist the raw response, and expose an operator recovery state.
- `SCN-173-004`: A positive cancellation response followed by an active carrier tracking state remains unreconciled, persists both responses, and raises a deduplicated alert.
- `SCN-173-005`: Prepaid/COD carrier response maps to documented `Returned` terminal state; pickup response maps to documented `Cancelled` terminal state.
- `SCN-173-006`: A retry/reconciliation run sees a previously pending attempt, re-reads carrier status, and either confirms it once or keeps one actionable alert without duplicate side effects.
- `SCN-173-007`: A Delhivery API timeout, non-JSON response, rate limit, or tracking read failure leaves local state recoverable and visible rather than treating the operation as successful.
- `SCN-173-008`: Existing active-shipment tracking continues to store tracking responses and update ordinary shipment statuses; only cancellation reconciliation adds the new branch.
- `SCN-173-009`: Unauthenticated requests cannot invoke the reconciliation route; carrier credentials are never exposed to client code or logs.
- `SCN-173-010`: A carrier cancellation failure cannot create an unintended refund/stock/order state; the refund-ordering decision is explicitly approved before implementation.
- `SCN-173-011`: Concurrent tracking/cancellation writes preserve cancellation evidence and do not overwrite one another or exceed the agreed retention bound.
- `SCN-173-012`: Multiple Delhivery identifiers, mixed Delhivery/Shiprocket shipments, and overlapping cancellation callers produce one coherent attempt state.
- `SCN-173-013`: Carrier payloads and endpoint errors are redacted in logs and safe at the HTTP boundary.
- `SCN-173-014`: A divergence alert is visible to the authorized order-manager surface, has required metadata, deduplicates atomically, and points to a defined recovery action.

## Invariants

- `INV-173-001`: No absent, unknown, or negative carrier signal is interpreted as cancellation success.
- `INV-173-002`: Local cancellation state is never marked reconciled before the carrier verification read confirms an accepted terminal state.
- `INV-173-003`: Every cancellation attempt has durable raw evidence in the existing shipment JSON audit field before a success/failure decision is applied.
- `INV-173-004`: Reconciliation is idempotent and does not double-refund, double-restore stock, or emit duplicate alerts for the same unresolved attempt.
- `INV-173-005`: A carrier/local cancellation divergence remains discoverable by Renivet without requiring a customer or carrier complaint.
- `INV-173-006`: Existing successful payment, order creation, tracking, Shiprocket, and ordinary Delhivery status transitions remain behaviorally unchanged.
- `INV-173-007`: Carrier tokens and customer-sensitive raw responses remain server-side.
- `INV-173-008`: Financial side effects do not occur in a new order relative to carrier cancellation until the Class C refund-ordering decision is resolved.
- `INV-173-009`: Cancellation evidence uses explicit version/merge/retention semantics and cannot be erased by an ordinary tracking write.
- `INV-173-010`: Concurrent cancellation/reconciliation attempts share a durable attempt identity and cannot duplicate terminal side effects.
- `INV-173-011`: Logs and HTTP responses never expose raw carrier/customer-sensitive payloads.
- `INV-173-012`: Every unresolved divergence is discoverable and actionable by an authorized order manager.

## Flow and architecture

`FLOW-173-001`: Cancellation caller → shared Delhivery cancellation request → explicit response classifier → raw-attempt persistence → follow-up tracking read → terminal-state classifier → local shipment/order transition or pending reconciliation state → deduplicated operational alert.

The implementation should extract pure helpers for payload construction, response classification, carrier terminal-state classification, and reconciliation decisioning. Both existing cancellation callers must use the shared service. The existing `/api/delhivery/cron` route remains cron-secret protected and gains a bounded reconciliation pass for pending/divergent cancellation attempts. The existing monitoring alert/audit infrastructure is reused; no schema migration or new dashboard is approved.

## Dependencies and integrations

- `DEP-173-001`: Delhivery cancellation API contract and staging fixtures; status `pending` until the configured staging account confirms response shapes.
- `DEP-173-002`: Delhivery tracking API and terminal status mapping; status `resolved` from the existing tracking route and public documentation.
- `DEP-173-003`: Existing `orderShipments.delhiveryTrackingJson` JSONB audit field; status `resolved`.
- `DEP-173-004`: Existing cron authentication/scheduling and `createOperationalAlert` monitoring path; status `resolved`.
- `DEP-173-005`: Existing refund/stock ordering in cancellation flows; status `resolved` as an exclusion constraint—do not broaden payment or inventory behavior except to prevent false successful local cancellation.
- `DEP-173-006`: Refund/stock ordering decision; status `blocked` pending explicit human confirmation because the current callers refund before carrier cancellation.
- `DEP-173-007`: Alert access, atomic dedupe, and recovery-action semantics; status `pending` pending order-ops surface verification.

- `INT-173-001`: Delhivery cancellation endpoint `/api/p/edit`; explicit request, positive-response allowlist, timeout/error handling, and raw response persistence.
- `INT-173-002`: Delhivery tracking endpoint `/api/v1/packages/json`; follow-up verification and bounded polling/reconciliation.
- `INT-173-003`: Renivet monitoring SLA alerts; deduplicated critical/warning alert owned by `order_manager` with order/shipment/waybill metadata.

## Security boundaries

- `SEC-173-001`: Only server-side code with existing authenticated customer/order-ops permissions may initiate cancellation.
- `SEC-173-002`: The cron reconciliation endpoint requires the existing cron secret and must fail closed.
- `SEC-173-003`: `DELHIVERY_TOKEN` is server-only; raw response persistence must not be returned to customers or logged verbatim.
- `SEC-173-004`: Reconciliation updates are scoped to the identified shipment/order and cannot cross tenant/brand ownership boundaries.

## Decisions

- `DEC-173-001` (`AUTO_DECIDE`, resolved): Use explicit positive allowlists for cancellation and terminal tracking states; missing/unknown values are failures because the current fail-open classifier caused the confirmed risk.
- `DEC-173-002` (`RECOMMEND_CONTINUE`, resolved): Reuse `delhiveryTrackingJson` with a structured cancellation-attempt envelope and the existing operational alert/audit path instead of adding a migration; this preserves rollback simplicity and the issue's no-schema-change constraint.
- `DEC-173-003` (`RECOMMEND_CONTINUE`, unresolved pending dependency): Confirm exact staging response fixtures and whether the configured account returns `Returned` versus `Cancelled` for each payment mode before finalizing the literal allowlist. This is an integration verification action, not permission to accept unknown responses.
- `DEC-173-004` (`HUMAN_CONFIRMATION`, resolved by product direction): Delhivery cancellation and follow-up terminal-state verification must succeed before Renivet finalizes local shipment/order cancellation, refund, or stock restoration. A carrier failure leaves the order recoverable and alerts order operations; it must not be treated as a successful cancellation.

## Critic outcome

The independent fresh-context L3 Critic completed read-only review and returned `BLOCKED`. Product direction resolved the refund-ordering blocker, but two design blockers remain: unspecified carrier allowlists and conflict-safe JSONB evidence retention. The major findings require the added concurrency, redaction, alert-discoverability, and multi-path failure requirements above before implementation can be approved.

## Test expectations

- `TEXP-173-001` (`unit`, REQUIRED): Payload builder emits `waybill` plus `cancellation: "true"` and never `action`.
- `TEXP-173-002` (`unit`, REQUIRED): Response classifier accepts only explicit documented positive shapes and rejects missing, malformed, failure, and unknown shapes.
- `TEXP-173-003` (`unit`, REQUIRED): Carrier terminal-state classifier covers `Cancelled`, `Canceled`, `Returned`, active states, and malformed tracking responses.
- `TEXP-173-004` (`unit`, REQUIRED): Reconciliation decisioning preserves pending state and emits one alert key for active/ambiguous carrier state.
- `TEXP-173-005` (`component`, REQUIRED): Customer and order-ops cancellation callers both use the shared service and gate local cancellation on verification.
- `TEXP-173-006` (`regression`, REQUIRED): Existing ordinary Delhivery tracking, Shiprocket cancellation, successful payment, refund, stock, and order flows remain unchanged outside the approved gate.
- `TEXP-173-007` (`security`, REQUIRED): Cron authorization, server-only token use, response redaction/logging, and shipment/order scoping are preserved.
- `TEXP-173-008` (`integration`, REQUIRED): Staging fixtures verify request payload, positive/negative response handling, raw persistence, follow-up status read, and idempotent retry.
- `TEXP-173-009` (`e2e`, REQUIRED): In a confirmed Delhivery sandbox, cancel an eligible AWB and verify the carrier state transitions to the documented terminal state before local cancellation is accepted.
- `TEXP-173-010` (`exploratory`, REQUIRED): Verify a carrier/local divergence becomes visible in existing order-ops monitoring and remains actionable after repeated reconciliation runs.

## Exclusions and uncertainties

- No carrier dashboard or merchant request/response logs are available in this session; the issue's sponsor evidence is accepted as the defect fact, while causal payload/response behavior must be verified with staging fixtures.
- Delhivery's API permits cancellation only in specific carrier lifecycle states; the implementation must not promise cancellation for already delivered/out-for-delivery shipments.
- Existing refund-before-carrier-cancel ordering may leave a refund pending when carrier cancellation fails. This specification does not invent a new refund policy; it requires no false local cancellation and explicit operator visibility. Any decision to reorder financial side effects requires a separate approved contract.
