# Version Triggers — P02

## Trigger for REN-165 to move from "verification" to "V2 build"

- Phase 1 verification (`09-validation/EXPERIMENT_STRATEGY.md`) produces a GO or "promising" verdict, backed by evidence (analytics review, survey, or comparable-pattern research) — not by opinion or by this document's existence. This package's completion does **not** itself constitute verification having occurred.

## Trigger for REN-168 to move from "deferred" to "scopeable"

Per the issue's own tracking status, "gated on demonstrated business need." Concretely (this package proposes the following as what "demonstrated" should mean, since the source issue does not itself specify a number — **DECISION REQUIRED** to ratify or replace this proposal):

- Measured evidence that a meaningful share of multi-item carts/orders contain items with a real, non-obvious co-purchase pattern not already captured by single-item similarity (i.e., items frequently bought together that are *not* visually/stylistically similar to each other — the case single-item similarity structurally cannot catch). This requires, at minimum, an analysis of existing `orderItems` history (a one-off analysis, not new instrumentation) to even determine if such a pattern exists at meaningful scale.
- A conversion or AOV hypothesis specific enough to justify the new pipeline's build cost, reviewed and approved by whoever owns product/business prioritization for this Epic — not an engineering-only decision.

## What does NOT count as a trigger

- Engineering convenience or "we're already touching this code" (REN-147/150/157/160 work touching adjacent files is not, by itself, a reason to also build REN-168).
- A single stakeholder's intuition that "frequently bought together" would be nice to have, without the demonstrated-need evidence above.
