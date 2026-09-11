# Algorithm Evaluation — P02

## What's evaluable today (CONFIRMED constraint)

There is no existing measurement infrastructure (per `04-architecture/INTEGRATIONS.md`'s analytics note) that attributes conversions, clicks, or add-to-cart actions specifically to any of the three recommendation placements. This means: **no current A/B or offline evaluation of the existing algorithms' quality is possible without first adding instrumentation.** This is itself one of REN-160/165's underlying gaps, and constrains what V1 can claim to "evaluate" — V1 fixes are evaluated for *correctness against acceptance criteria* (did the bug get fixed), not for *lift* (did it improve a business metric), because no baseline measurement exists to compare against.

## Evaluation approach for V1 fixes

| Fix | How to evaluate | What "good" looks like |
|---|---|---|
| FR-1 (REN-147 fallback) | Manual/simulated ML-host-outage test (point `EMBEDDING_SERVICE_URL`-equivalent at an unreachable host in a test environment, or mock the axios call to reject) + AC-1 | Cross-sell section still renders non-ML-dependent suggestions during simulated outage |
| FR-2 (REN-150 ranking) | Code review of generated SQL/`ORDER BY` clause + a fixture test comparing input rank order to output row order | Output row order matches (or closely tracks, if Option 2 tiering chosen) input `priorityProductIds` order |
| FR-3 (REN-157 copy) | Content/copy review against FR-3.2's specific string list; no runtime test needed | No shopper-facing string implies basket-composition awareness beyond single-item similarity |
| FR-4 (REN-160 caching) | Instrumented cache-hit-rate check (new logging per NFR-7) + latency comparison pre/post on a repeated identical request | Second identical request within TTL served from cache; latency measurably lower |

## Algorithm quality, independent of the confirmed bugs (INFERRED, not measured)

- **Placement A/B's single-item similarity** is a reasonable, industry-standard baseline for "visually/stylistically similar item" recommendations and is not itself flagged as low-quality by any tracked issue — the complaints (REN-147, REN-157) are about resilience and copy-accuracy, not model quality. No evidence in this pass suggests the similarity model itself produces poor results; **UNKNOWN** without user-facing measurement.
- **Placement C's multi-signal Postgres scorer** (order/wishlist/browsing/search cascade) is a reasonably sophisticated rule-based system for a first-party, ML-free personalization approach — the confirmed defect (REN-150) is entirely in how its output is *consumed* downstream, not in the scoring logic itself. This is a notable point: fixing REN-150 unlocks value that was already built and is just being wasted, which is a higher-leverage fix per unit of engineering effort than most feature work would be.

## What would need to be true before evaluating "is this the right algorithm" (not just "is this bug-free")

Per REN-160/165's gap: recommendation-impression and recommendation-click/recommendation-attributed-conversion events would need to exist (see `09-validation/SUCCESS_METRICS.md`) before any A/B test or offline lift evaluation of algorithm *quality* (as opposed to bug presence) is possible. This is out of V1 scope but named here so it isn't lost — see `10-roadmap/V2.md`.
