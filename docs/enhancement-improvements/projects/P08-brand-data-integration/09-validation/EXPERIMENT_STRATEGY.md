# Experiment Strategy — P08

## NOT APPLICABLE in the classic A/B sense

This Epic is an internal-tooling/data-ingestion capability, not a customer-facing feature with a control/treatment split — there is no meaningful randomized experiment to run ("half of brands get dry-run previews, half don't" is not a responsible experiment design given BR-3's no-silent-corruption requirement). No experiment strategy from the research program proposes one, and this package does not invent one.

## What V1 should instead treat as a staged rollout, not an experiment

- **Stage 1**: internal/pilot brand(s) exercise the full File-First pipeline against real (or realistic) data before general availability, specifically to generate the first real match-data set needed for `05-algorithms/ALGORITHM_EVALUATION.md`'s Phase 2 precondition.
- **Stage 2**: general availability to all brands, with the per-batch log and AI-assist audit log (already required by FR-15/NFR-7) serving as the observability this staged rollout needs — no separate experiment-tracking infrastructure required.

## What would count as a legitimate future "experiment" (Phase 2/V3, not V1)

Once real match data exists (per `05-algorithms/ALGORITHM_EVALUATION.md`), comparing candidate-ranking approaches (e.g., trigram-only vs. trigram+embedding) against human-confirmed labels is a legitimate offline evaluation — still not a live A/B experiment against brands, since BRule-1 prohibits any auto-apply path that a live experiment would need to test.

## Success metrics for the staged rollout

See `09-validation/SUCCESS_METRICS.md`.
