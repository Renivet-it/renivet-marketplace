# Success Metrics — P02

## V1 fixes — engineering/correctness metrics (not business-lift metrics)

| Item | Metric | Target |
|---|---|---|
| REN-147 | Cart cross-sell render rate during simulated/actual ML-host outage | Non-zero (vs. today's confirmed zero) |
| REN-150 | Correlation between `getPersonalizedRecommendations`'s output rank and final displayed product order | Strong positive (vs. today's non-existent correlation beyond binary membership) |
| REN-157 | Presence of flagged overclaiming phrases in shipped copy | Zero (checklist-verifiable) |
| REN-160 | Cache hit rate on repeated identical requests within TTL | High (e.g., >80%, **INFERRED target**, tune post-launch) |

**Note:** these are process/correctness metrics appropriate to confirmed-defect fixes, not business-outcome metrics (conversion lift, AOV, etc.) — per `08-reliability/OBSERVABILITY.md` and `06-data/DATA_REQUIREMENTS.md`, no baseline business-outcome measurement exists for these surfaces today, so no lift target can be honestly set for V1. Setting a fabricated lift target here would violate this package's classification discipline.

## REN-165 verification — what "success" means for the verification itself, not for a hypothetical feature

Success for REN-165's Phase 1 (per `EXPERIMENT_STRATEGY.md`) is a **documented, evidence-backed verdict** (GO/NO-GO/INSUFFICIENT-DATA) — not a specific answer. A well-reasoned NO-GO is just as much a successful outcome of this verification as a GO would be.

If Phase 2 (instrumented pilot) occurs, candidate metrics (**INFERRED, proposed, not committed**) would be: repeat-purchase rate within N days, or click-through rate on post-purchase suggestions — exact metric and target would be defined at Phase 2 scoping time, not here.

## REN-168 — no success metrics defined

Explicitly deferred; metrics would be defined alongside a future scoping pass if the gate in `10-roadmap/VERSION_TRIGGERS.md` is ever met.

## Portfolio-level measurement dependency

Per `07-feasibility/DEPENDENCIES.md`, any future ability to measure recommendation *business* impact (as opposed to today's correctness-only metrics) depends on P06 (Measurement & Experimentation) work and/or new impression/click instrumentation that does not exist today. This is named as a forward-looking gap, not a V1 deliverable.
