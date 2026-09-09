# REVIEW: REN-147 — Cart cross-sell fallback independent of the ML host

## Executive Result

**REVIEW_PASSED_WITH_FINDINGS**. The implementation has **NO_DRIFT** from the
approved contract. It was compared from `origin/master`
`aebc080fcf9ac31e3d2da8470f13c5cc56e82ca3` to
`94a61dfb8e5a553809484fe8fec0d5018ad04a08`. Governance re-entry is not
required. The required staging ML-outage exercise remains outstanding.

## Review Scope and Git Evidence

The comparison contains the task-local governance artifacts plus the
implementation in `src/lib/trpc/routes/general/cart.ts`, the new local fallback
module `wardrobe-suggestion-fallback.ts`, and its focused test file. The worktree
was clean after the implementation commit. Linear REN-147 remains Backlog and
continues to define the same ML-host outage objective and REN-146 relationship.

## Requirement Reconciliation

- **REQ-147-001:** PASS — `cart.ts#getWardrobeSuggestions` retains the existing
  advanced recommendation-ID path before the vector/local path.
- **REQ-147-002:** PASS — the embedding/vector lookup remains the next tier when
  advanced recommendations provide no usable IDs.
- **REQ-147-003:** PASS — `getVectorOrDeterministicFallbackRows` selects the
  local tier after a vector failure or empty vector result; the local query uses
  distinct cached-cart category IDs and deterministic best-seller then recency
  ordering.
- **REQ-147-004:** PASS — `getDeterministicWardrobeFallbackRows` has no external
  call, parameterizes category and exclusion lists, excludes cart IDs, and
  applies deleted, active, available, published, and approved constraints.
- **REQ-147-005:** PASS — the local query limits to eight and selects the same
  card fields consumed by the existing media enrichment and normalization code.
- **REQ-147-006:** PASS — category-less carts return no local rows without a
  query, and an empty local query remains the existing intentional empty state.
- **REQ-147-007:** PASS — the fallback logger includes only an enum-like reason,
  with no user, cart, product, or search-text value.

## Scenario Reconciliation

- **SCN-147-001:** PASS — the primary path is unchanged in `cart.ts`.
- **SCN-147-002:** PASS — non-empty vector rows are returned unchanged by
  `getVectorOrDeterministicFallbackRows`.
- **SCN-147-003:** PASS — rejected vector work invokes the local resolver; the
  focused test asserts local rows are returned on ML rejection.
- **SCN-147-004:** PASS — empty vector results and category-less carts resolve to
  the deliberate empty result without invoking a catalog query.
- **SCN-147-005:** PASS — the existing early empty-cart return remains before all
  recommendation and fallback work.

## Invariant Reconciliation

- **INV-147-001:** PASS — final-tier helper has only the injected database
  executor and no ML import/call.
- **INV-147-002:** PASS — the local query has a parameterized `NOT IN` membership
  condition built from every cart product ID.
- **INV-147-003:** PASS — the changed flow consists solely of cache reads and
  catalog selects.
- **INV-147-004:** PASS — advanced then vector candidates return before the
  deterministic resolver is selected.
- **INV-147-005:** PASS — no public tRPC or component interface changed; returned
  rows flow through the original media and card normalization block.

## Flow and Architecture Review

**PASS.** `FLOW-147-001` preserves the existing advanced/vector progression.
`FLOW-147-002` adds the approved final local tier inside the cart router while
isolating category extraction, fallback control flow, and local query execution
in a task-specific helper. `DEP-147-001` is satisfied by cached cart product
categories; `DEP-147-002` and `INT-147-003` are satisfied by the local catalog
query and existing media enrichment. `INT-147-001` and `INT-147-002` remain
best-effort, read-only upstream tiers; failed or empty vector behavior now has a
local recovery path.

## Security and Integration Review

**PASS.** `SEC-147-001` is preserved: no route authorization boundary was
changed, and fallback diagnostics do not include customer/cart values. The local
query uses bound values for category and cart product lists. No secret, payment,
schema, cache mutation, or external write behavior was added.

## Scope and Drift Review

**PASS — NO_DRIFT.** Changed application files are limited to the approved cart
route and its task-local helper/test. No timeout configuration, primary matching
algorithm, UI copy, schema, or unrelated surface changed.

## Test Expectation Review

- **TEXP-147-001:** PASS — focused tests cover category de-duplication and the
  category-less no-query behavior.
- **TEXP-147-002:** PASS — focused tests cover rejected ML-vector lookup selecting
  local rows, vector rows retaining priority, and local-row return behavior.
- **TEXP-147-003:** PASS — focused tests cover vector priority; primary behavior
  is unchanged in the inspected diff.
- **TEXP-147-004:** PARTIAL — no staging run against an unreachable ML host is
  available in the Git evidence.

## Findings

### REV-147-001

- Severity: LOW
- Category: test
- Description: The required staging exercise with an unreachable ML host has not
  been recorded.
- Evidence: TEXP-147-004 requires the exercise; the comparison contains focused
  automated tests but no staging evidence artifact.
- Impact: The deployed integration path still needs environment-level validation
  against the specific outage condition.
- Recommendation: In staging, make the ML host unreachable, open a categorized
  cart, confirm local suggestions render, and record the result before rollout.

## Decisions Requiring Attention

None.

## Final Recommendation

No blocker and no governance re-entry are required. Complete
**REV-147-001** before production rollout; then the branch is suitable for PR
review.
