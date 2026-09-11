# Experiment Strategy — P05 Customer Journey & UX

## REN-144 — not an experiment, a correctness fix
Payment/order integrity is not something to A/B test — every customer must get the correct behavior. No experiment applies; validation is via `09-validation/TEST_STRATEGY.md` and production monitoring (`08-reliability/OBSERVABILITY.md`), not a rollout experiment.

## REN-95 — candidate for a staged rollout, not a classic A/B test
Given the size and risk of guest checkout (schema change, new authorization surface), a staged/percentage rollout (once implemented) is more appropriate than a randomized conversion experiment — the goal is de-risking a large change, not measuring an uncertain effect (guest checkout's conversion benefit is well-established industry knowledge per `00-context/BUSINESS_CONTEXT.md`, not something Renivet needs its own experiment to prove before deciding to build it). A post-launch conversion-rate comparison (guest-checkout cohort vs. historical forced-login baseline) is reasonable to run passively, not as a gating experiment.

## REN-161 — no experiment needed
This is a disclosure/honesty fix, not a growth lever to optimize — ship the accurate copy once FR-5.1 resolves the underlying rule.

## Not applicable
No item in this Epic is a candidate for a ranking/personalization experiment (consistent with `07-feasibility/FEASIBILITY_ASSESSMENT.md`'s AI/MCP NOT APPLICABLE finding).
