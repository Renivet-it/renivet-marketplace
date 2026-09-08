# REN-133 Purchase Tracking Consolidation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the duplicated checkout Meta Purchase instrumentation with one tested shared helper while preserving the server-owned PostHog purchase event.

**Architecture:** Extend the existing `src/lib/analytics/meta-purchase.ts` module with a dependency-injected client tracking function. Each checkout component adapts its local item and customer state to that one function; order-success trigger locations remain unchanged.

**Tech Stack:** TypeScript, React/Next.js client modules, Bun test, Meta Pixel, server CAPI action.

**Spec:** `docs/.work-items/REN-133/SPEC.md`

## Global Constraints

- Do not change order creation, payment, cart clearing, redirects, notifications, event taxonomy, or server PostHog capture.
- Preserve the current Meta event ID, payload fields, matching fields, and one-attempt behavior.
- Analytics failures must not escape into checkout; add no retry or deduplication state.

---

### Task 1: Shared Meta purchase tracker

**Files:**
- Modify: `src/lib/analytics/meta-purchase.ts`
- Modify: `src/lib/analytics/meta-purchase.test.ts`

**Interfaces:**
- Consumes: completed order IDs, total paise, `{ productId, quantity }[]`, existing user matching fields, source URL, and injected Pixel/CAPI transports.
- Produces: `trackMetaPurchase(input, dependencies): void`, which skips empty IDs, emits Pixel and CAPI with the same event ID/payload, and isolates both transport failures.

- [ ] Add failing tests for successful paired emission, empty-order skip, synchronous Pixel failure with continued CAPI attempt, and asynchronous CAPI rejection isolation.
- [ ] Run `bun test src/lib/analytics/meta-purchase.test.ts` and confirm failures are caused by the absent shared tracker.
- [ ] Add the minimal typed shared tracker implementation using the existing payload builder.
- [ ] Run the focused test and confirm all cases pass without unhandled rejection output.

### Task 2: Replace both checkout-local implementations

**Files:**
- Modify: `src/app/(protected)/mycart/Component/payment-stepper/order-payment-page.tsx`
- Modify: `src/app/(protected)/checkout/checkout-content.tsx`
- Modify: `src/lib/analytics/meta-purchase.test.ts`

**Interfaces:**
- Consumes: `trackMetaPurchase` from the shared analytics module.
- Produces: local callbacks that only map checkout state to the shared input and dependencies.

- [ ] Add a failing regression test that checks the two source modules call the shared tracker and no longer directly call `fbEvent("Purchase", ...)` or `trackPurchaseCapi`.
- [ ] Run the focused test and confirm it fails against the duplicated implementations.
- [ ] Replace each local implementation with a call to `trackMetaPurchase`, preserving its item collection, customer fields, URL, and every existing callback invocation.
- [ ] Run focused Meta and purchase analytics tests.

### Task 3: Verify and review the approved contract

**Files:**
- Create during read-only review: `docs/.work-items/REN-133/REVIEW.md`
- Modify during read-only review: `docs/.work-items/REN-133/work-item.yaml` review result only.

- [ ] Run `bun test` because TypeScript application/test files changed.
- [ ] Run `bun run governance:validate -- docs/.work-items/REN-133/work-item.yaml`.
- [ ] Run the read-only `$renivet-review REN-133` reconciliation and validate the resulting work item.
- [ ] Inspect the full base-to-working-tree diff for scope and accidental changes.

## Self-review

- Requirements REQ-133-001 through REQ-133-005 map to Tasks 1–3.
- Scenario coverage includes successful pairing, all existing checkout adapters, empty IDs, independent transport failures, unchanged server PostHog ownership, and no retry/deduplication.
- The plan contains no implementation placeholders and uses the same `trackMetaPurchase` interface throughout.
