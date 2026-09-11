# Target Algorithm — P01

No algorithm changes are proposed by this Epic — every fix is around correctness, latency, and observability of the *existing* algorithm, not a new ranking approach. This document exists to state that explicitly and show the only structural deltas.

## What changes structurally

1. **Fallback-chain construction becomes conditional** (REN-158): `ilikeFallback` is only built/evaluated when `ragIds` is empty, instead of unconditionally.
   ```
   if exact brand match: candidates = brandId filter
   elif ragIds non-empty: candidates = inArray(ragIds)      # was: inArray(ragIds) OR ilikeFallback
   else: candidates = ilikeFallback
   ```
2. **Brand-embedding branch and RAG fetch run concurrently** (REN-151) — no change to what either branch computes, only when.
3. **Every external call gets a bounded timeout** (REN-146) — the fallback *behavior* on failure is unchanged (already-existing catch blocks), only the *trigger* for entering that fallback path changes from "the promise eventually rejects or the function returns" to "the promise rejects at or before the timeout."
4. **`requireMedia` count and data are computed from the same predicate** (REN-155) — either by pushing the valid-media-URL check into SQL (if feasible against the media/Redis architecture) or by re-running `count()` after the application-level filter for `requireMedia` requests specifically. **DECISION REQUIRED** on which approach — see `07-feasibility/BUILD_REUSE_BUY_SIMPLIFY.md`.
5. **A cache layer sits in front of the category-only path** (REN-159) — algorithmically a no-op (same candidates, same ranking) when served from cache; this only changes *how often* the algorithm actually runs, not its output for a given input at a given catalog state.

## What explicitly does not change

- No new scoring function, no new ML model, no change to the 0.28 brand-match threshold, no change to RAG's internal ranking (opaque, external), no change to sort-priority order, no change to intent-classification priority order (brand → mapping table → fallback).
- REN-149 changes *what the client does with* the already-computed `intentType`/`redirectUrl` — it does not change how `intentType` is computed.

## Why no target ML/ranking redesign is proposed

Per `07-feasibility/FEASIBILITY_ASSESSMENT.md`: the external microservice already exists, is reused (not replaced) by both P01 and P02, and every backlog item in this Epic is achievable with deterministic engineering fixes. Proposing a new ranking algorithm here would be scope creep unsupported by any evidence of a ranking-quality problem — no click-through data exists yet to even diagnose whether ranking quality is a real issue (that's precisely what REN-154 is a prerequisite for). See `11-critique/ANTI_OVERENGINEERING_REVIEW.md`.
