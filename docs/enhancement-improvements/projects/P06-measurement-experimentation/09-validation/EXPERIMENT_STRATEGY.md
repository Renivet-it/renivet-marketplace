# Experiment Strategy — P06

This Epic is a correctness-fix Epic, not an A/B-testable feature — there is no user-facing variant to test. "Experimentation" in this Epic's context means *validating the measurement fix itself*, not running a growth experiment.

## Post-fix validation experiment
1. Ship the REN-145 fix (currency + fan-out) to production.
2. Over a subsequent comparable period, re-pull the same reconciliation view used in the 2026-08-23 growth audit (Meta-attributed purchases vs. PostHog raw vs. PostHog strict) via Windsor.ai/PostHog HogQL, same methodology as `docs/growth-audits/2026-08-23/`.
3. Compare whether Meta's reported AOV/purchase value moves toward PostHog's rupee-denominated total_amount for the same orders, and whether Meta's purchase *count* moves toward one-per-checkout rather than one-per-brand.
4. Do **not** compute or publish a "% improvement" or ROI figure from this comparison unless the new data cleanly supports a specific number — apply the same evidence discipline used throughout this package (see `00-context` and `06-data/DATA_QUALITY.md`). A qualitative "did the gap narrow, in which direction" read is appropriate; a fabricated precise percentage is not.

## No formal A/B test needed
Because this is a bug fix to a broken measurement pipeline (not a design choice with plausible alternatives that need comparing on a live-traffic split), a standard before/after comparison is the right validation method, not a randomized experiment.

## Business-side experiment (independent of engineering fix)
Reactivating `Remarketing_Sara` (BR-6) is itself a natural experiment marketing can run immediately and independently: resume the campaign, monitor CPA/purchase volume over a subsequent comparable window, and compare against the 4.9x-better historical CPA figure. This does not require any engineering fix to be shipped first.
