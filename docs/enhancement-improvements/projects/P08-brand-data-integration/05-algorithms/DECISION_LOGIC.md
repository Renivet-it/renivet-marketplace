# Decision Logic — P08

## Why Tier 2 auto-apply was corrected (the program's own adversarial finding)

`14-critic/AI_CRITIQUE.md` found that `CONFIDENCE_MODEL.md`'s Tier 2 ("auto-apply, flagged for audit sampling") directly contradicts three earlier documents — `AI_USE_CASES.md` (Candidate 8), `AI_GUARDRAILS.md`, and `SKU_MATCHING.md` — all of which state identity/SKU matching must never auto-apply "at any confidence." The contradiction arose because `CONFIDENCE_MODEL.md` (Wave 4/5) was published *after* the guardrail documents (Wave 7-8) without reconciling against them; `SKU_MATCHING.md` itself explicitly deferred final confidence-tier policy to "Wave 4/5's CONFIDENCE_MODEL.md," which "does not yet exist" at authoring time — a forward reference nothing later closed the loop on until the critic pass. **No document in the research program flagged this contradiction or reconciled it before `14-critic/AI_CRITIQUE.md`.**

## Why the guardrail wins, not the confidence model

Two reasons, both evidentiary:

1. **The corroboration signals are weak exactly where the failure mode is costliest.** Corroborating signals (brand, variant attributes, price band) are strong against cross-*product* confusion but weak against cross-*variant* confusion — same brand, same title, same price, wrong size/color. This is simultaneously the costliest failure mode (wrong stock/price applied to the wrong physical item) and the hardest for a human to catch after the fact, because the resulting data still "looks correct" on inspection.
2. **No empirical validation exists anywhere in the program.** `CONFIDENCE_MODEL.md` §5 itself states its 0.90/0.75 thresholds are "a reasoned starting point, not a measured one." No production match data exists to validate them against real false-positive/negative rates.

## The decision rule (applies from V1 onward)

Any fuzzy/AI-assisted identity match — including what would have been Tier 2 — is queued for human confirmation and never auto-written, until **all three** of the following hold:
- (a) Real match data validates the similarity thresholds against actual false-positive/negative rates.
- (b) The minimal provenance extension has shipped (this package's V1 scope already includes this — see `06-data/DATA_REQUIREMENTS.md`).
- (c) `brand_external_identifiers` pin-once persistence is enforced in code, so a confirmed match is never re-guessed by the fuzzy path on a later sync.

(a) and (c) are V3-territory (see `10-roadmap/V3.md`); (b) is V1 scope. This is why re-enabling any form of Tier 2 auto-apply cannot happen before V3 even if a decision-maker wanted it sooner — two of the three preconditions don't exist until V3 components ship.

## A secondary gap the critic pass surfaced: provenance-as-gate

`AI_GUARDRAILS.md` itself calls provenance tracking "a hard blocker... before any apply-with-flag tier can be responsibly enabled," but `CONFIDENCE_MODEL.md`'s original Tier 1/2 design made no mention of this prerequisite, treating provenance as nice-to-have rather than a gate. This package treats provenance as a hard gate consistent with `AI_GUARDRAILS.md`, not as an enhancement.

## Decision rule for Phase 2 sequencing generally

No Phase 2 component is scheduled as engineering work from a date; each is scheduled from a named, observable trigger (see `10-roadmap/VERSION_TRIGGERS.md`). This mirrors the same evidentiary discipline applied to the Tier 2 correction: don't act on a plausible-but-unvalidated design when a stricter, already-validated fallback (human review) is cheap and available.
