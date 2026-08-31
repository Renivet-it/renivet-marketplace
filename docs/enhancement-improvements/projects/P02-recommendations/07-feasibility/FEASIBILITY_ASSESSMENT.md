# Feasibility Assessment — P02

## REN-147 (fallback independence) — HIGH feasibility, LOW-MEDIUM complexity

The working pattern already exists in this codebase (Placement B's fallback chain, `01-research/EVIDENCE_INDEX.md` #5). This is a port/reuse job, not new engineering. Complexity comes from: (a) deciding how to derive "same-category-as-cart-items" when cart items may span multiple categories (Placement B has this easy — one viewed product, one category; Placement A has up to 3 cart items, potentially multiple categories — needs a tie-breaking rule, a small but real design decision), and (b) fixing the dead `EMBEDDING_SERVICE_URL` config alongside it (small, mechanical). **Feasibility verdict: GO** (see `99-final/GO_NO_GO.md`).

## REN-150 (rank preservation) — HIGH feasibility, LOW complexity

Confirmed to be a localized fix in one function (`getProducts`'s `priorityProductIds` handling). No upstream data model change needed — `getPersonalizedRecommendations` already produces a correctly-ordered array; the fix is purely in how that order is encoded into SQL. **Feasibility verdict: GO.**

## REN-157 (copy) — HIGH feasibility, TRIVIAL complexity

Pure content change in two React components, no logic change, no data model impact. The main effort is *deciding* the replacement copy (a content/product-marketing task) more than *implementing* it. **Feasibility verdict: GO.**

## REN-160 (caching) — HIGH feasibility, LOW-MEDIUM complexity

The pattern (`unstable_cache`) already exists and is used adjacent to the exact code needing it. Main complexity: correct cache-key design (per-`productId` vs per-`userId`, per `05-algorithms/DECISION_LOGIC.md`) and TTL selection balancing staleness risk (BR-1) against cost/latency benefit. No new infrastructure procurement needed — reuses `next/cache` and/or existing Redis (`userCartCache` et al.'s underlying Redis instance). **Feasibility verdict: GO.**

## REN-165 (post-purchase surface) — feasibility of the *surface itself* is not yet assessable; feasibility of *verification* is HIGH

Building a post-purchase recommendation surface, if approved, would likely be feasible at similar complexity to Placement C (reusing the Postgres-based scorer, since order data is freshest and most relevant right after a purchase) — but this is **INFERRED, not scoped**, because REN-165 is verification-only. What is assessable now: running a lightweight verification (survey, analytics review of adjacent surfaces, or a low-cost qualitative check) is cheap and low-risk. **Feasibility verdict for the surface: VERIFICATION REQUIRED before GO/NO-GO can be assessed** (see `99-final/GO_NO_GO.md`). **Feasibility verdict for running the verification itself: GO** (it's just an analysis task).

## REN-168 (co-occurrence signal) — NOT ASSESSED for build feasibility; explicitly deferred

Per the orchestrator's instruction and the tracking status ("do not build speculatively"), this package does not assess build feasibility in detail. Directionally (see `TARGET_ALGORITHM.md`'s V2/V3 note): it would require a new data pipeline (co-purchase aggregation over `orderItems`) that does not exist today, making it materially higher complexity than any V1 item — but exact effort is not estimated here since scoping it would itself be premature given the gate is not met. **Feasibility verdict: DEFER** (see `99-final/GO_NO_GO.md`).
