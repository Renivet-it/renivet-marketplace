# Build / Reuse / Buy / Simplify — P02

## REN-147: REUSE

Port Placement B's existing, working fallback chain pattern to Placement A. No build of new fallback logic from scratch, no buy (no vendor needed), no simplify needed (the target isn't overbuilt).

## REN-150: SIMPLIFY (fix, don't rebuild)

The upstream ranking logic (`getPersonalizedRecommendations`) is already appropriately scoped and does not need simplification or rebuilding — it's good work being wasted downstream. The fix is a minimal, localized change to consumption logic. Explicitly reject any temptation to "redesign the personalization scoring system" while touching this code — that would be scope creep beyond a confirmed, narrow defect (see `11-critique/ANTI_OVERENGINEERING_REVIEW.md`).

## REN-157: BUILD (content, not code)

No reuse/buy/simplify axis applies meaningfully — this is a copy-writing task.

## REN-160: REUSE

`next/cache`'s `unstable_cache` is already in use in the same file (`storefront-catalog-page.tsx`) for adjacent queries — extend the same mechanism rather than introducing a new caching library or a bespoke Redis wrapper. For Placement A/B's product-keyed cache, either `unstable_cache` or the existing Redis cache-module pattern (`userCartCache`, `mediaCache` style) would work; **DECISION REQUIRED** on which, but both are "reuse an existing pattern," not "build new infrastructure."

## REN-165 (verification only): BUY nothing, BUILD nothing — the task itself is analysis

Verification can be done with existing tools (a short user survey via existing channels, or a lightweight review of analogous e-commerce post-purchase patterns) — no new tooling procurement needed to answer the verification question.

## REN-168 (deferred): explicitly not evaluated on this axis

Per scope instructions, this package does not perform a build/reuse/buy/simplify analysis for the co-occurrence signal beyond noting (per `05-algorithms/TARGET_ALGORITHM.md`) that it would require a **new** data pipeline — i.e., were it ever approved, it would sit on the "build" end of this spectrum, since no existing co-purchase aggregation exists to reuse and no vendor relationship for this specific capability was found in the codebase or docs. This is not a recommendation to build it — it remains gated and deferred.

## AI/ML feasibility note (per orchestrator instruction)

The external single-item similarity service already exists and is reused (not rebuilt) by all V1 fixes touching Placements A/B. Were REN-168 ever approved, it would likely need **new** AI/data work (a co-purchase pipeline is a different capability than single-item similarity, not an extension of the existing service) — this is flagged honestly here per instruction, without designing it, since it remains deferred.

## MCP feasibility note (per orchestrator instruction)

**Not applicable.** No Model Context Protocol integration point exists or is relevant to any V1 fix, to REN-165's verification, or to REN-168's deferred future work — these are conventional web-app backend/frontend/copy changes and a data pipeline, not agent-tool-integration concerns.
