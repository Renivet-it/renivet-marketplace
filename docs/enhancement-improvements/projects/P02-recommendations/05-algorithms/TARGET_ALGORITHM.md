# Target Algorithm (V1 scope only) — by placement

V1 targets are deltas from `CURRENT_ALGORITHM.md`, scoped strictly to REN-147/150/157/160. No new candidate-generation model, no diversity logic, and no basket co-occurrence are proposed here — those are V2/V3 (`../10-roadmap/V2.md`, `V3.md`) and gated (REN-168) or unverified (REN-165).

## Placement A: Cart cross-sell — target delta

- **Candidate generation:** unchanged (external similarity model, up to 3 cart items).
- **Fallback (changed, FR-1):** add a Postgres-only fallback tier, mirroring Placement B's existing pattern — e.g., same-category-as-cart-items best-sellers, then platform best-sellers — triggered when the primary *and* same-host vector fallback both fail or the primary path's underlying host is unreachable. Implementation should reuse `productQueries`/`getProducts`-equivalent calls already used elsewhere, not a new query engine.
- **Caching (changed, FR-4.2):** wrap `getAdvancedRecommendations` calls with a per-`productId` cache (TTL: **DECISION REQUIRED**, propose starting at 1-6 hours given product catalogs and single-item similarity don't change minute-to-minute — see `NON_FUNCTIONAL_REQUIREMENTS.md` NFR-4).
- **Copy (changed, FR-3):** revise labels per `03-requirements/FUNCTIONAL_REQUIREMENTS.md` FR-3.2/3.3.
- Ranking, filtering, diversity, measurement: unchanged from current (out of V1 scope — see `11-critique/ANTI_OVERENGINEERING_REVIEW.md` for why adding ranking/diversity now would be scope creep beyond the confirmed defects).

## Placement B: PDP similar products — target delta

- **Caching (changed, FR-4.2):** same per-`productId` cache as Placement A — since both call the identical function, a single cache keyed by `productId` (not by surface) serves both placements from one cache population. This is the most efficient interpretation of FR-4.2 and should be implemented once, shared.
- **Copy (changed, FR-3):** revise per FR-3.2.
- Everything else (candidate generation, fallback chain, ranking, filtering): unchanged — this placement is already the healthier of the two ML-dependent placements and is largely a template, not a target, for change.

## Placement C: Shop-page personalized sort — target delta

- **Ranking (changed, FR-2):** replace the binary `CASE WHEN id IN (...) THEN 0 ELSE 1 END` with a rank-preserving ordering. Two viable approaches (choice is **DECISION REQUIRED**, both satisfy FR-2.1/2.2):
  - **Option 1 — true position preservation:** `CASE products.id::text WHEN 'id_0' THEN 0 WHEN 'id_1' THEN 1 ... WHEN 'id_n' THEN n ELSE n+1 END ASC`, generated dynamically from `priorityProductIds`'s array order. Exact-rank fidelity; SQL grows linearly with list size (bounded — `getPersonalizedRecommendations`'s `limit` param, default 20, caps this).
  - **Option 2 — coarse tiering:** split `priorityProductIds` into e.g. top-5 / next-10 / rest, three `CASE` buckets instead of two. Simpler SQL, less precise, still a material improvement over today's 2-bucket scheme.
  - This package's recommendation (not a mandate): Option 1, since the list is already small and bounded (≤20-50 per `getPersonalizedRecommendations`'s `limit` cap), making the "SQL complexity" downside of true position preservation negligible while fully resolving the defect.
- **Caching (changed, FR-4.1):** wrap `getPersonalizedRecommendations`'s full call (all branches) in a per-`userId` cache. TTL **DECISION REQUIRED** — propose short (minutes, e.g. 5-15) given this branch is sensitive to recent browsing/order actions (see NFR-4); this is intentionally much shorter than Placement A/B's product-keyed cache since staleness here is shopper-perceptible in a session, not just a cost concern.
- Candidate generation, filtering, diversity: unchanged (diversity is explicitly out of V1 scope, same reasoning as Placement A).

## Placement D: Post-purchase — no target algorithm in V1

Not designed here. If REN-165's verification produces a GO, a target algorithm would be scoped in a follow-up pass, likely starting from Placement C's Postgres-only pattern (order-history-driven) rather than the ML-host pattern, since post-purchase context has strong first-party signal (the order just placed) and no obvious need for the external similarity service. This is a **directional note for future scoping, not a committed design.**

## V2/V3 note (REN-168) — not designed here

A genuine co-occurrence/"frequently bought together" algorithm would require a fundamentally different data asset (co-purchase pair frequency, computed from `orderItems` history — this data exists in Postgres today but no aggregation/pipeline over it exists) and a different serving pattern (precomputed pair-affinity lookup, likely a scheduled batch job rather than a real-time external call). This is named at the level of "what category of work this would be," per the orchestrator's instruction not to design it in detail while it remains deferred/gated. See `07-feasibility/BUILD_REUSE_BUY_SIMPLIFY.md`.
