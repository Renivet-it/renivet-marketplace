# Anti-Overengineering Review — P02

Per `../../PORTFOLIO_ANTI_OVERENGINEERING.md` discipline, cross-checked here for this Epic specifically.

## Things this package deliberately does NOT propose, and why

1. **A unified recommendation microservice/abstraction layer** — named as a legitimate medium-term idea in `ARCHITECTURE_CRITIQUE.md` but explicitly not proposed as V1 (or even V2) work. Four confirmed, narrow bugs do not justify a service-layer rewrite; that would be solving a problem (architectural consistency) nobody asked for, at cost disproportionate to REN-147/150/157/160's actual scope.
2. **A scheduled batch-precompute job for recommendations (REN-160 alternative)** — rejected in `07-feasibility/ALTERNATIVES.md` in favor of simple TTL-based read-through caching, because a batch job introduces new infrastructure (scheduler, job monitoring, staleness-until-next-run) to solve a problem a much simpler cache adequately addresses.
3. **A second external ML host for redundancy (REN-147 alternative)** — rejected; the confirmed defect is architectural coupling to one host, not "one host isn't enough hosts." Fixing coupling (via an independent, different-technology fallback) is proportionate; adding infrastructure redundancy to a single-vendor dependency is not this Epic's job and isn't requested by the issue.
4. **Diversity/anti-clustering logic for Placements A/B** — explicitly named as out of V1 scope in `05-algorithms/TARGET_ALGORITHM.md`. No tracked issue asks for this; adding it while touching this code would be unrequested scope expansion.
5. **Designing REN-168 (co-occurrence) in detail** — repeatedly declined throughout this package per its explicit deferred/gated status. The temptation to "just sketch the schema while we're here" is exactly the kind of speculative-build creep the issue's own tracking status warns against.
6. **A full A/B testing framework build-out for REN-165** — a phased, cheap-first verification approach (`09-validation/EXPERIMENT_STRATEGY.md`) is proposed instead of jumping straight to an instrumented pilot, precisely because REN-165 is PROBABLE-confidence, not confirmed — investing in heavy experimentation infrastructure before even a lightweight check would be premature.

## Where this package added scope beyond the letter of the six issues (and why that's justified, not overengineering)

- **FR-1.4** (fixing the dead `EMBEDDING_SERVICE_URL` config) is technically beyond REN-147's literal title but is directly load-bearing for REN-147's fix to be genuinely configurable/testable (per `TEST_STRATEGY.md`'s staging-validation approach) — without it, the fix can't be validated against a controlled unreachable-host scenario without further hardcoded-string surgery. This is treated as in-scope-by-necessity, not scope creep.
- **FR-2.3** (fixing the misleading code comment) is a one-line, zero-risk addition justified purely by not leaving a known-false comment in place while touching the exact line it describes.

## Verdict

This package's V1 scope is proportionate to the four confirmed defects. No item recommends building infrastructure, models, or abstractions beyond what's needed to close REN-147/150/157/160, and every place this package's own analysis found a tempting adjacent improvement (shared service layer, batch precompute, ML redundancy, diversity logic, REN-168 detail design), it explicitly declined to expand scope.
