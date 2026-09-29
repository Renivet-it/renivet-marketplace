# REVIEW: REN-244 — Daily WhatsApp alerts for delayed fulfillment orders

## Executive Result

`REVIEW_FAILED` with `MATERIAL_DRIFT`. Compared `origin/main` merge-base `58a5a2b2d236449d788e0f26a988d1eadb6e2591` to head `7ad4136967a1c57cb15c460c556c9fe7f82fec2e`. Governance re-entry is required because the implementation uses one static aggregate CTA destination, while the Linear acceptance requires an order-specific action-button URL for each delayed order.

## Review Scope and Git Evidence

- Linear issue: REN-244, title matches task-local `task.id` and work-item directory.
- Base branch: `origin/main`.
- Base commit: `58a5a2b2d236449d788e0f26a988d1eadb6e2591`.
- Head commit: `7ad4136967a1c57cb15c460c556c9fe7f82fec2e`.
- Changed scope: delayed-order eligibility, WhatsApp templates, persistence schema/query, aggregate service, cron route, migration, tests, runbook, and governance artifacts.

## Requirement Reconciliation

- `REQ-244-1`: PASS. `src/app/api/cron/delayed-whatsapp-alerts/route.ts` uses the external 17:00 UTC schedule documented in the runbook and returns the schedule metadata.
- `REQ-244-2`: PASS. `src/lib/whatsapp/delayed-order-alerts.ts` implements paid pending/processing 48-hour eligibility.
- `REQ-244-3`: PASS. The same module implements paid shipped seven-day shipment eligibility and terminal exclusions.
- `REQ-244-4`: FAIL. The aggregate service sends one variable and the approved templates use a static `/dashboard/general/orders` button; no order identifier is passed to a button URL. This contradicts the Linear requirement for an order-specific authenticated admin order-detail action button.
- `REQ-244-5`: PASS. `runDelayedWhatsAppAlerts` normalizes/deduplicates recipients and creates one aggregate send per alert type/recipient.
- `REQ-244-6`: PASS. `whatsapp_delayed_order_alerts` persists per-order/alert/recipient state and claims batches before sending.
- `REQ-244-7`: PASS. The route invokes `requireCronSecret` before the run service.

## Scenario Reconciliation

- `SCN-244-1`: PASS — exact 48-hour boundary is unit-tested.
- `SCN-244-2`: PASS — exact seven-day boundary and terminal exclusions are unit-tested.
- `SCN-244-3`: FAIL — aggregate product/status/tracking data is rendered, but the action button is not order-specific.
- `SCN-244-4`: PASS — multi-order aggregation and three-recipient fan-out are tested.
- `SCN-244-5`: PASS — successful suppression and failed retry are tested with an in-memory store.
- `SCN-244-6`: PARTIAL — atomic claim code exists, but no database-backed concurrency test is present.
- `SCN-244-7`: PARTIAL — route source wiring is tested, while runtime request authorization is delegated to existing tested `requireCronSecret` behavior.
- `SCN-244-8`: PASS — multi-order continuation and isolated failure are covered by the service tests.

## Invariant Reconciliation

- `INV-244-1`: PASS — injected `now` and inclusive thresholds are implemented.
- `INV-244-2`: PASS — cancelled/delivered orders and terminal shipment states are excluded.
- `INV-244-3`: PASS — unique identity plus atomic `sending` claim is implemented.
- `INV-244-4`: PASS — per-order rows retain sent/failed state and retry data.
- `INV-244-5`: FAIL — the CTA uses runtime host configuration but does not include an order ID because the approved aggregate template has a static URL.
- `INV-244-6`: PASS — aggregate failures are marked without changing other batches.
- `INV-244-7`: PASS — processing is per alert type/recipient and does not abort after one failed batch.

## Flow and Architecture Review

The pure eligibility layer, per-order delivery table, atomic claim layer, aggregate service, and cron boundary match `FLOW-244-1` and `FLOW-244-2`. The architecture is `PARTIAL` overall because the aggregate CTA architecture cannot satisfy the original per-order button contract without either per-order messages, dynamic button URLs, or a contract change in Linear.

## Security and Integration Review

- Cron authorization is protected by the existing timing-safe Bearer-secret path (`src/lib/auth/cron-access.ts`, `route.ts`), supporting `SEC-244-1`.
- No Twilio credentials are written to logs or templates, supporting `SEC-244-3`.
- The aggregate CTA points at the existing authenticated orders page, but it is not order-specific; `SEC-244-2` is only partially satisfied.
- Twilio integration SIDs are checked into application configuration as approved content identifiers, and the send path uses one aggregate variable per template.
- PostgreSQL persistence includes a unique identity and batch claim, but database concurrency behavior is not runtime-tested in this review.

## Scope and Drift Review

`MATERIAL_DRIFT`: the implementation changes the requested action-button semantics from one order-specific admin URL per alert to one static aggregate orders-page URL. This affects an explicit Linear requirement, scenario, invariant, and external template contract. The aggregate behavior was user-requested in conversation, but Linear remains unchanged and the mismatch must be reconciled through governance.

## Test Expectation Review

- `TEXP-244-1`: PASS statically — pure unit tests cover boundaries, exclusions, formatting, and host URL construction.
- `TEXP-244-2`: PARTIAL statically — service tests cover fan-out, aggregation, success suppression, and retry with a fake store; no live database concurrency test.
- `TEXP-244-3`: PARTIAL statically — existing shipment notification code was not changed, but no dedicated regression test asserts compatibility with the new schema.
- `TEXP-244-4`: PARTIAL statically — route delegates to the existing tested cron helper, but the new route has no direct runtime request test.
- `TEXP-244-5`: FAIL — tests cover aggregate template names and one variable but cannot prove the required order-specific button parameter because the supplied templates do not contain one.
- `TEXP-244-6`: PASS statically — schedule is documented in the route and runbook.

## Findings

### REV-001

- Severity: BLOCKER
- Category: requirement
- Description: Aggregate templates use a static `Open Orders` CTA, so an alert does not carry a relevant order-specific admin action-button URL as required by REN-244.
- Evidence: `REQ-244-4`, `SCN-244-3`, `INV-244-5`; `src/lib/services/delayed-whatsapp-alerts.ts` sends one aggregate variable; `src/lib/whatsapp/index.ts` registers both templates with `parameterCount: 1`; `docs/runbooks/REN-244_DELAYED_WHATSAPP_ALERTS.md` documents the static `/dashboard/general/orders` destination.
- Impact: Operators cannot jump directly from an alert to the specific delayed order, and the implementation does not satisfy the explicit Linear acceptance criterion.
- Recommendation: Choose one governed resolution: create per-order CTA templates/messages with an order-ID URL variable; change the Linear acceptance to explicitly allow an aggregate static orders-page CTA; or add a supported multi-order action mechanism and update the contract before rerunning REVIEW.

## Decisions Requiring Attention

The user-approved aggregate digest design conflicts with the unchanged Linear requirement for order-specific buttons. This is a Class C contract decision because it changes an external integration and operator workflow. No implementation-side assumption can resolve it.

## Final Recommendation

Do not treat REN-244 as review-passed. Resolve `REV-001` through Linear/spec governance, then rerun `renivet-review REN-244`. The current aggregate implementation may be retained only if the requirement is formally changed; otherwise the Twilio templates and send strategy must be redesigned.
