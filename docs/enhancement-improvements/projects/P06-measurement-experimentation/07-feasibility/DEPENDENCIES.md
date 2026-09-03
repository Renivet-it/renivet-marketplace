# Dependencies — P06

## Upstream
- **P05 (Customer Journey & UX)** — CONFIRMED real dependency per `docs/enhancement-improvements/DEPENDENCY_GRAPH.md`: P06's REN-145 fix touches the same checkout `onSuccess` handlers that P05's REN-144 (P0, payment/order integrity) also touches. Coordinate the two fixes; do not let them regress each other. REN-152 (P05's checkout consolidation effort) may be a natural place to land REN-133's consolidation as well — worth a conversation between the two Epic owners, not mandated here.
- **P01 (Search)** — REN-154 (search click/result-count logging is a no-op stub) blocks P06 from measuring search quality; owned by P01, cited not duplicated.
- **P02 (Recommendations)** — REN-160/165 similarly gate P06's ability to measure recommendation-surface events.

## Downstream / stated future
- **P07 ("Algorithm/ML/AI", not formalized)** — stated as a future dependency in `MASTER_REGISTER.md` ("P07 (stated future dependency)"), but P07 itself is not formalized (no owned model/dataset/pipeline exists per `ML_AI_LIFECYCLE.md`). No concrete work is blocked by this today.

## Internal (within P06)
- REN-131 and REN-133 should be designed together (see `07-feasibility/FEASIBILITY_ASSESSMENT.md` — avoiding a new double-count defect when adding server-side capture requires the same consolidation work).
- REN-166 is gated on DECISION-P06-001 (`docs/enhancement-improvements/07-decisions/DECISION_QUEUE.md`) — no engineering work should start before this resolves.
- REN-164's verification should ideally complete before REN-129 is treated as fully and permanently closed for any high-stakes early-funnel analysis, though REN-129 itself is already shipped.

## External
- Meta CAPI/Pixel platform behavior (attribution windows, dedup, anomaly filtering) is outside Renivet's control and is the reason REN-145's *historical runtime magnitude* claim stays at PROBABLE rather than CONFIRMED — Renivet cannot fully verify how Meta's own systems processed already-sent bad events.
