# Version Triggers — P06

| Trigger | Unlocks |
|---|---|
| REN-145 merged and deployed | Enables meaningful post-fix reconciliation experiment (`09-validation/EXPERIMENT_STRATEGY.md`) |
| REN-131 + REN-133 merged together | Closes the "measurement blind if client fails" and "duplicated instrumentation" gaps as a pair (per `07-feasibility/DEPENDENCIES.md`, do not ship independently without considering dedup) |
| DECISION-P06-001 resolves "GA4 needed" | Unlocks REN-166 V2 scope; until then, REN-166 stays Backlog/Deferred, not scheduled |
| DECISION-P06-001 resolves "GA4 not needed" | REN-166 can be closed/rejected rather than perpetually deferred |
| REN-164 verification completes, defect confirmed | Unlocks a V2 fix item for the init-timing race |
| REN-164 verification completes, no defect found | REN-164 closes as "verified, not an issue" — no further roadmap item needed |
| GA4 added (if V2 proceeds) AND fan-out grows to 4 systems | Reconsider the shared `emitCommerceEvent()` abstraction (currently rejected for V1) |
