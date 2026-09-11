# Test Strategy — P01

This defines what should be tested and why; it does not implement tests (documentation-only pass, per this project's boundary). Aligns with the existing SPEC→REVIEW→TEST governance (`docs/governance/codex-spec-adapter-design.md`) and the `renivet-test` skill (`.agents/skills/renivet-test/SKILL.md`) — this document does not redesign that process, it maps this Epic's issues onto it.

| Layer | Applicable? | What to cover |
|---|---|---|
| UNIT | Yes | `shouldApplySearchRelevanceOrdering` (existing, keep passing — regression guard for SE-F002); new predicate-construction logic for REN-158 (ILIKE branch omitted when `ragIds` non-empty); REN-155's count/filter alignment logic in isolation |
| INTEGRATION | Yes | `getProducts()` end-to-end against a test DB for each filter combination touched (REN-155, REN-158); tRPC `processSearch` → client `onSuccess` wiring for REN-149 |
| E2E | Yes | Search-bar submit → correct navigation target, for each `intentType` (REN-149); catalog page load showing consistent result count (REN-155) |
| NEGATIVE | Yes | Empty query, malformed/very long query, query matching zero brands/categories/products |
| FAILURE | Yes | External service down / slow / malformed response — verify fallback still returns correct results within the new timeout bound (REN-146); verify REN-151's parallel branches each degrade independently on partial failure, matching current sequential behavior's fallback semantics |
| SECURITY | Limited | Confirm no injection vector introduced by any WHERE-clause change (REN-158, REN-151-adjacent code); confirm `priorityProductIds` provenance question from `08-reliability/SECURITY.md` if that code is touched |
| PERFORMANCE | Yes, but comparative not absolute | REN-151: measure wall-clock time of the parallel branch pair vs. today's sequential baseline (no absolute SLA exists to test against, per `08-reliability/PERFORMANCE.md`) |
| REGRESSION | Yes — critical | Keep `product-ordering.test.ts` passing through every change in this Epic that touches `getProducts()`'s WHERE/orderBy construction (REN-151, REN-158, REN-155); add regression coverage for SE-F002's bug shape as an explicit named case if not already covered |
| A/B | Not applicable now | No traffic-splitting mechanism confirmed to exist for search; not proposed by this Epic — see `08-reliability/OBSERVABILITY.md` for why baseline metrics must exist first |
| INDEPENDENT VALIDATION | Yes, per existing process | Route each issue through `renivet-test`'s Level 1 flow once a `work-item.yaml` contract exists (per `docs/governance/codex-spec-adapter-design.md`); Level 2 (independent release validation) recommended at minimum for REN-149 and REN-155 given their direct customer-visible impact |

## Issue-specific test notes

- **REN-146**: test with a simulated slow/hanging endpoint (mock) to verify the timeout actually fires and fallback engages — cannot realistically test against the real external service's hang behavior.
- **REN-154**: verify the `searchAnalytics` row's `resultCount` is populated end-to-end, and that `logSearchClick` persists a real record (not just returns `{success:true}`).
- **REN-156**: verify build succeeds and no import references remain after deletion — a compile-time check, not a runtime test.

## What this Epic does not need

A new test framework, a load-testing tool, or a synthetic-monitoring product — none of the fixes here are large or risky enough to justify new tooling beyond what `renivet-test`'s existing Level 1/Level 2 process and Bun's existing test runner (evidenced by `product-ordering.test.ts` using `bun:test`) already provide.
