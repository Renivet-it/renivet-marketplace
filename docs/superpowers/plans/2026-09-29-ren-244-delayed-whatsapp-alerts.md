# REN-244 Delayed WhatsApp Alerts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Send aggregate 48-hour fulfillment and 7-day delivery WhatsApp digests for every qualifying order, with per-order audit state, safe retries, and cron protection.

**Architecture:** Pure eligibility and digest-formatting functions will be isolated from database and Twilio effects. A persistence table will track each order/alert/recipient delivery identity, while the run service claims pending identities into aggregate batches, sends one message per alert type and recipient, and marks every member success or retryable failure. The existing authenticated general orders page is the CTA destination.

**Tech Stack:** Next.js App Router, TypeScript, Bun tests, Drizzle/PostgreSQL, Twilio Content API, existing cron-secret helper.

**Spec:** `docs/.work-items/REN-244/SPEC.md`

## Global Constraints

- Run at 23:00 Asia/Kolkata (`0 17 * * *` UTC) through the existing external cron convention.
- Use approved template SIDs `HX66935bd1bb1d457b0a943640fd75b6c2` and `HX4410ca3f94e43b70cc1d6761ddda7134`.
- Aggregate orders by alert type, but preserve idempotency per `(order_id, alert_type, phone_number)`.
- Use `/dashboard/general/orders` and runtime host configuration; never embed credentials or a hard-coded environment host.
- Use Bun for tests and run `bun test` after TypeScript changes.

## Review Focus

- Exactly-at-threshold timestamps qualify, while one millisecond earlier does not — test pure eligibility.
- Multiple orders are all included without one failure aborting later orders — test aggregate batching and isolated failure handling.
- A successful order/alert/recipient identity is never sent again, including overlapping runs — test claim/idempotency behavior.
- Failed aggregate sends remain retryable without resending successful identities — test state transitions.
- Missing AWB/tracking/product data produces safe fallback text and never leaks Twilio credentials — test payload formatting.

### Task 1: Eligibility and digest payloads

**Files:**
- Create: `src/lib/whatsapp/delayed-order-alerts.ts`
- Test: `src/lib/whatsapp/delayed-order-alerts.test.ts`

**Interfaces:**
- Produces `AlertType`, `DelayedOrderCandidate`, `isUnshippedEligible`, `isUndeliveredEligible`, `buildDelayedDigestVariable`, and `buildDelayedOrdersActionUrl`.

- [ ] **Step 1: Write failing tests** for exact 48-hour/7-day boundaries, cancelled/delivered/RTO/failed exclusions, multi-order compact formatting, missing shipment fallbacks, and runtime-host action URL.
- [ ] **Step 2: Run `bun test src/lib/whatsapp/delayed-order-alerts.test.ts` and verify the expected missing-module failure.**
- [ ] **Step 3: Implement the pure functions with injected `now`, inclusive comparisons, compact one-line order entries, and the existing `/dashboard/general/orders` path.**
- [ ] **Step 4: Re-run the focused tests and verify all pass.**

### Task 2: Per-order alert persistence and atomic claims

**Files:**
- Create: `src/lib/db/schema/whatsapp-delayed-alert.ts`
- Modify: `src/lib/db/schema/index.ts`
- Modify: `src/lib/db/queries/whatsapp.ts`
- Create: `drizzle/0270_delayed_whatsapp_alerts.sql`
- Test: `src/lib/db/queries/whatsapp-delayed-alert.test.ts`

**Interfaces:**
- Produces query methods `upsertPendingAlerts`, `claimPendingAlerts`, `markBatchSent`, and `markBatchFailed` for the run service.

- [ ] **Step 1: Write failing query-contract tests** covering unique order/alert/recipient identity, success suppression, failed retry eligibility, and batch claim isolation.
- [ ] **Step 2: Run the focused test and verify it fails because the delayed-alert query module is absent.**
- [ ] **Step 3: Add the Drizzle table/migration and query methods. Claims must atomically move only pending/retryable rows to `sending` with a batch ID.**
- [ ] **Step 4: Run focused query tests and verify they pass.**

### Task 3: Aggregate Twilio run service

**Files:**
- Create: `src/lib/services/delayed-whatsapp-alerts.ts`
- Modify: `src/lib/whatsapp/index.ts`
- Test: `src/lib/services/delayed-whatsapp-alerts.test.ts`

**Interfaces:**
- Consumes Task 1 pure functions and Task 2 query methods.
- Produces `runDelayedWhatsAppAlerts({ now, dependencies })` returning counts by alert type, order, recipient, sent, failed, and skipped.

- [ ] **Step 1: Write failing service tests** for both template SIDs, three-recipient fan-out, multiple orders per digest, isolated recipient failure, successful suppression, and retry of failed batches.
- [ ] **Step 2: Run the focused test and verify it fails because the service is absent.**
- [ ] **Step 3: Implement candidate loading, per-order state seeding, aggregation by alert type/recipient, Twilio send calls with one variable, and sent/failed state transitions.**
- [ ] **Step 4: Run focused service tests and verify they pass.**

### Task 4: Protected cron endpoint and runbook

**Files:**
- Create: `src/app/api/cron/delayed-whatsapp-alerts/route.ts`
- Create: `docs/runbooks/REN-244_DELAYED_WHATSAPP_ALERTS.md`
- Test: `src/app/api/cron/delayed-whatsapp-alerts/route.test.ts`

**Interfaces:**
- Consumes the Task 3 service and existing `requireCronSecret`.
- Exposes `GET /api/cron/delayed-whatsapp-alerts` with JSON run summary.

- [ ] **Step 1: Write failing route tests** for missing/invalid/valid Bearer secret and successful multi-order summary response.
- [ ] **Step 2: Run the focused route test and verify it fails because the route is absent.**
- [ ] **Step 3: Implement the protected route and document the external scheduler configuration `0 17 * * *` UTC / 23:00 Asia/Kolkata, template SIDs, and retry behavior.**
- [ ] **Step 4: Run focused route tests and verify they pass.**

### Task 5: Full verification and governance review

**Files:**
- Modify: `docs/.work-items/REN-244/work-item.yaml`
- Create: `docs/.work-items/REN-244/REVIEW.md`

- [ ] **Step 1: Run `bun test`.**
- [ ] **Step 2: Run `bun run governance:validate -- docs/.work-items/REN-244/work-item.yaml`.**
- [ ] **Step 3: Run `$renivet-review REN-244` in read-only review mode and reconcile the implementation diff.**
- [ ] **Step 4: Record any required actions without changing code during the review phase.**

---

## Self-review

All explicit requirements are covered by Tasks 1–4. Multi-order aggregation, threshold timing, status exclusions, CTA URL construction, three-recipient fan-out, idempotency, retryability, cron authentication, and the external schedule are each pinned to tests. The only external prerequisite is that the supplied Twilio templates remain approved and active; their SIDs are recorded in the service tests and implementation.

