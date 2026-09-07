# Renivet Backlog Easy Tasks Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the remaining low-effort Renivet backlog work in dependency order, while keeping verification-only and deferred issues out of unapproved implementation scope.

**Architecture:** Independent verification and copy-only tasks are handled first. Code changes that touch shared checkout, analytics, payment, or search paths are investigated separately and implemented only after their task-local contract is ready. All work remains in the shared repository and is integrated through focused tests plus the full Bun suite.

**Tech Stack:** Next.js, TypeScript, Bun tests, Linear, repository governance validator.

**Spec:** Linear issue descriptions for REN-157, REN-161, REN-162, REN-163, REN-164, REN-165, REN-155, and REN-156; REN-134 is already implemented.

## Global Constraints

- Use Bun for tests and scripts.
- Run `bun test` after TypeScript changes.
- Do not implement deferred work REN-166 or REN-167 before their stated product/measurement gates.
- Run `bun run governance:validate -- <work-item.yaml>` for every changed work item.
- Use `renivet-spec` before implementing non-trivial Linear tasks.
- Do not update Linear status or close issues without explicit user instruction.

### Task 1: Recommendation copy correction (REN-157)

Files: recommendation copy components identified by repository search; add a focused copy regression test. Replace claims of complementary/pairing behavior with similarity-based wording only.

- [x] Search the cart and PDP recommendation surfaces and identify exact copy call sites.
- [x] Add a failing test asserting the misleading copy is absent and the approved similarity wording is present.
- [x] Run the focused test and confirm it fails for the current copy.
- [x] Apply the minimal copy-only change.
- [x] Run the focused test and `bun test`.

### Task 2: Welcome interstitial verification (REN-112)

Files: existing welcome interstitial component and its tests/documentation if needed.

- [x] Trace the cold-load and post-cart contexts and determine whether the differing third-button copy is intentional.
- [x] Add or update a regression test only if a confirmed behavior change is required.
- [x] Report the evidence; no behavior change was required.

### Task 3: Post-purchase recommendation verification (REN-165)

Files: checkout/order-success components only for read-only investigation.

- [x] Inspect the complete order-confirmation path and existing recommendation components.
- [x] Record the item as a product opportunity requiring a separate scoped feature.
- [x] Do not implement a new feature from this verification-only issue.

### Task 4: PostHog timing verification (REN-164)

Files: PostHog provider and browser verification harness only.

- [x] Inspect the delayed initialization path.
- [x] Confirm the existing PostHog queue-before-init behavior and timing test.
- [x] Do not add remediation code from this verification-only issue.

### Task 5: Coupon disclosure (REN-161)

Files: both checkout coupon-display surfaces and focused tests.

- [x] Confirm the copy-only two-flow change is L1 and does not require a non-trivial implementation spec.
- [x] Add a failing test for disclosure visibility after TRYNEW20 auto-application.
- [x] Add the same narrow disclosure to both flows.
- [x] Run focused checkout tests and `bun test`.

### Task 6: Payment cancellation context (REN-163)

Files: `src/lib/razorpay/payment.ts`, callers, and focused tests.

- [ ] Create and validate the required Renivet specification before implementation.
- [ ] Add a failing regression test for Buy Now, swap-reward, and normal-cart cancellation destinations.
- [ ] Implement the smallest caller-context-aware redirect change.
- [ ] Run focused tests and `bun test`.

### Task 7: Product-click tracking (REN-162)

Files: search-result and homepage product-card components plus analytics tests.

- [ ] Create and validate the required Renivet specification before implementation.
- [ ] Add failing tests for click recording on both missing surfaces.
- [ ] Reuse the existing shop-grid tracking pattern without changing event semantics.
- [ ] Run focused tests and `bun test`.

### Task 8: Dead AI suggestion client cleanup (REN-156)

Files: dead client, search call sites, and tests.

- [ ] Create and validate the required Renivet specification before implementation.
- [ ] Add a failing test or static assertion proving redundant calls are removed.
- [ ] Remove only dead/redundant code covered by the issue.
- [ ] Run focused tests and `bun test`.

### Task 9: `requireMedia` pagination fix (REN-155)

Files: catalog query/pagination implementation and query tests.

- [ ] Inspect the query and classify the change under Renivet governance.
- [ ] Add a failing test proving page counts and rows are filtered consistently.
- [ ] Apply the minimal query/pagination fix.
- [ ] Run focused tests and `bun test`.

## Exclusions

- REN-166 remains deferred pending a product decision about GA4 revenue reporting.
- REN-167 remains deferred pending fallback-activation measurement from REN-146.
