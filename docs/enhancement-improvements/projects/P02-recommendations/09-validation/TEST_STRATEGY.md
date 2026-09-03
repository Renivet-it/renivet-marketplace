# Test Strategy — P02

Aligned to the program's existing SPEC → REVIEW → TEST governance (referenced from `../../../` program docs, not redefined here). This section defines test *intent*, not implementation — no tests are written as part of this documentation-only package.

## REN-147

- **Unit/integration:** mock `getAdvancedRecommendations` and `getEmbedding768` to both reject/error; assert `getWardrobeSuggestions` returns non-empty results from the new independent fallback tier rather than `[]`.
- **Unit:** assert existing-behavior regression guard — when the primary path succeeds, the new fallback tier is never invoked (no wasted queries).
- **Manual/staging:** point the (fixed) config at an unreachable host in a non-production environment to validate end-to-end behavior against AC-1, consistent with this program's staging-validation norms (see `../../XC-INFRA-001` context in `../../DEPENDENCY_GRAPH.md` re: staging evidence trustworthiness — this Epic's validation should not be exempt from that same rigor).

## REN-150

- **Unit:** given a fixed `priorityProductIds` array and a set of candidate products, assert the resulting query/ordering places priority products in an order matching (or consistent with, if tiering is chosen) their input array position — not just "present vs. absent."
- **Regression:** assert non-priority products still order correctly relative to each other (best-seller/recency tie-breakers unaffected outside the priority set).

## REN-157

- **Content review, not automated test:** a checklist review (against FR-3.2's specific string list) confirming no flagged phrase remains in shipped copy. Optionally, a simple string-match test (e.g., a snapshot or literal-string assertion) could guard against regression of the specific flagged phrases, but this is a lightweight guard, not the primary verification method for a content change.

## REN-160

- **Unit/integration:** assert a second call with identical parameters within TTL does not re-invoke the underlying external call/DB cascade (mockable via call-count assertions on the wrapped functions).
- **Integration:** assert cache expiry after TTL correctly triggers recomputation.
- **Security-adjacent test (per NFR-6):** assert two different `userId`s produce independently cached, non-cross-contaminated Placement C results.

## REN-165 (verification, not a build item — "test strategy" here means verification method)

See `EXPERIMENT_STRATEGY.md` — this is not a code-testing exercise.

## REN-168 (deferred)

No test strategy defined — not in build scope.

## General note on test placement

Per program conventions (`Keep files under 500 lines`, `/src`, `/tests` boundaries from the project's `CLAUDE.md`), actual test implementation for these fixes belongs under the existing `/tests` (or equivalent) directory structure at implementation time — this package does not create or specify exact test file paths, since no code changes are made in this documentation-only pass.
