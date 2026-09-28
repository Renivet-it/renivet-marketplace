# REN-237 Return/RTO Attribution Review Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make return/RTO financial attribution an explicit, audited reviewer decision while preserving the existing return-review UI and preventing changes after approved payout inclusion.

**Architecture:** Add pure attribution validation/lock helpers around the existing refund, RTO, payout, and audit models. Extend the current return-replace router and modal; do not create a parallel review surface or new fault taxonomy. Keep REN-236 as a downstream consumer of persisted attribution only.

**Tech Stack:** Next.js/React, tRPC, Drizzle/PostgreSQL, Bun tests, existing Radix dialog/DataTable/toast components.

**Spec:** `docs/.work-items/REN-237/SPEC.md`

## Global Constraints

- Customer reason and evidence are inputs only; explicit reviewer action is required before financial attribution.
- Customer returns use `refunds.costAllocation` with synchronized `refunds.policyBucket`.
- Carrier RTOs use `rto_dispositions.faultOwner` and existing `MANAGE_ORDERS` authorization.
- Attribution changes are rejected after an approved, processing, or completed payout cycle includes the order case.
- Reuse the existing return-replace modal, evidence upload/display, policy helpers, audit writer, and permission boundaries.
- Do not implement REN-236 payment-fee allocation or create a new fault taxonomy.

## Review Focus

- Customer return creation/approval must not write `brand_fault` before explicit reviewer attribution; test the no-review path.
- A payout lock must inspect line-item references and reject all approved-or-later statuses; test calculated versus approved boundaries.
- Updating `costAllocation` and `policyBucket` must be atomic; test failure/no-partial-update behavior where the query boundary permits.
- RTO cases and missing RTO rows must remain distinct; test existing and absent disposition context.
- Broken evidence URLs must render an unavailable state, not an empty/no-evidence state; test the image error path.

### Task 1: Attribution rules and payout-lock query boundary

**Files:**
- Create: `src/lib/finance/return-attribution.ts`
- Test: `src/lib/finance/return-attribution.test.ts`
- Modify: `src/lib/db/queries/finance-compliance.ts`

- [ ] Write failing tests for attribution notes requirement, payout status lock, and reference matching.
- [ ] Run `bun test src/lib/finance/return-attribution.test.ts` and observe the expected missing-module failure.
- [ ] Implement pure helpers and a query method that finds payout line items for an order/refund/RTO reference in approved-or-later cycles.
- [ ] Run the focused tests and verify they pass.
- [ ] Commit `feat: add return attribution lock rules`.

### Task 2: Explicit attribution API and remove automatic inference

**Files:**
- Modify: `src/lib/trpc/routes/general/returnReplace.ts`
- Modify: `src/lib/db/queries/finance-compliance.ts`
- Test: `src/lib/trpc/routes/general/returnReplace-attribution.test.ts`

- [ ] Write failing source/route tests proving create/approve do not infer attribution and explicit mutation requires authorization, notes, and lock checks.
- [ ] Run the focused test and observe the expected failure.
- [ ] Implement read context and explicit attribution mutation for return/refund cases, preserving `policyBucket` synchronization and audit events; wire RTO context to the existing disposition capability.
- [ ] Preserve approval/rejection as separate actions and remove only the automatic financial attribution side effect.
- [ ] Run route/finance tests and verify they pass.
- [ ] Commit `feat: add explicit return attribution workflow`.

### Task 3: Review modal, RTO context, and evidence failure state

**Files:**
- Modify: `src/app/(protected)/dashboard/general/return-replace/page.tsx`
- Modify: `src/app/(protected)/dashboard/general/return-replace/ReturnReplaceDetailsModal.tsx`
- Test: `src/app/(protected)/dashboard/general/return-replace/return-attribution-ui.test.ts`

- [ ] Write failing UI contract tests for distinct customer reason/final attribution, view-only controls, missing RTO context, unavailable images, and save failure state.
- [ ] Run them and observe the expected failure.
- [ ] Add read-only context, explicit attribution controls, notes/reclassification validation, toast/error handling, and per-image `onError` placeholder using existing UI primitives.
- [ ] Run the UI contract tests and verify they pass.
- [ ] Commit `feat: add return attribution review controls`.

### Task 4: Full verification and governance review

**Files:**
- Modify: `docs/.work-items/REN-237/work-item.yaml`
- Create: `docs/.work-items/REN-237/REVIEW.md`

- [ ] Run focused REN-237 tests, `bun test`, TypeScript checks, and `bun run governance:validate -- docs/.work-items/REN-237/work-item.yaml`.
- [ ] Invoke the REN-237 implementation review against the approved contract.
- [ ] Fix any critical/important findings with a failing regression test first.
- [ ] Commit review artifacts with `docs: review REN-237 implementation`.

