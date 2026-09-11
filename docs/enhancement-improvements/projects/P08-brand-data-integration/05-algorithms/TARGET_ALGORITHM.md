# Target Algorithm — P08

## Identity resolution waterfall (V1, exact-match only)

1. Exact `sku` match (brand-scoped).
2. Exact `barcode` match (brand-scoped) — a currently-unused but present field.
3. Exact normalized-title + full variant-attribute match.
4. No match → **held**, persisted to a reviewable queue. Never guessed, never dropped silently.

Steps 1-3 resolve automatically with no human step (this is a deterministic, rule-based waterfall, not a confidence tier). Step 4's held rows may receive AI-ranked fuzzy candidates as suggestions (see below), but resolution out of the held state always requires a human decision. (BRule-1; Research: `ENTITY_RESOLUTION.md`, corrected per `15-synthesis/SYNTHESIS.md` §2.)

## Schema/column mapping waterfall (two-phase)

**Phase A — onboarding-time / drift-triggered (semi-automated, human-confirmed):**
1. Exact match against a maintained alias dictionary per canonical field (deterministic, instant).
2. Fuzzy/embedding-assisted suggestion for anything not in the dictionary — one-time, human-in-the-loop. This is where AI genuinely earns its place in schema mapping.
3. Anything still unmatched is surfaced explicitly, never silently dropped.

**Phase B — runtime replay (fully deterministic, every subsequent sync):**
Every sync after the first uses the saved, confirmed mapping as a fixed lookup — no fuzzy matching, no AI, on the hot path. A mapping only re-enters Phase A if schema drift is detected (an expected column disappears — hard fail; a new column appears — flagged, ignored until mapped).

(Research: `05-identity-and-mapping/SCHEMA_MAPPING.md`.)

## Attribute/value normalization

1. Deduplicate distinct raw values within a batch (a 5,000-SKU catalog typically has only tens of distinct raw size/color/category strings).
2. Match against a **per-brand-scoped** lookup table (correction from `15-synthesis/SYNTHESIS.md` §6 — the original design proposed a global table, which the critic pass found insufficiently scoped).
3. On miss, AI resolves the value; the result is written back into the brand's lookup table, so AI-call volume trends toward zero over time (self-improving pattern).
4. Category mapping is held to a stricter review bar than size/color, since it affects search/browse. (Research: `08-ai-opportunities/ATTRIBUTE_NORMALIZATION.md`.)

## The corrected SKU-matching confidence model (replaces `CURRENT_ALGORITHM.md`'s Tier 2)

| Tier | Definition | Action (corrected, V1-onward) |
|---|---|---|
| Tier 1 — Deterministic exact | Unambiguous, rule-based | Auto-apply, no review (this is V1's entire identity-resolution scope) |
| Tier 2 — Corroborated fuzzy | Fuzzy signal + ≥1 corroborating signal | **Demoted to Tier 3 behavior: queued for human confirmation, never auto-written** |
| Tier 3 — Uncorroborated fuzzy | Single fuzzy signal or multiple weak signals | Held, human confirms/rejects before write (unchanged) |
| Tier 4 — No usable match | Below threshold or multiple equally-plausible candidates | Rejected, persisted unresolved (unchanged) |

The corrected rule, quoted from synthesis: any fuzzy/AI-assisted identity match — Tier 2 included — is treated as Tier 3 **"until all three of: (a) real match data exists to validate the 0.90/0.75 thresholds against actual false-positive/negative rates, (b) the minimal provenance extension ships, and (c) `brand_external_identifiers` pin-once persistence is enforced in code so a corrected/confirmed match is never re-guessed by the fuzzy path on a later sync."** (Research: `15-synthesis/SYNTHESIS.md` §2.) Building Tier 1 + suggest-only Tier 3/4 is V1 scope; re-enabling Tier 2 auto-apply is a Phase 2/V3 decision gated on that exact precondition set (see `10-roadmap/VERSION_TRIGGERS.md`).

## Anomaly detection (V1: rules only; AI: explanation only)

A rule/statistical layer (absolute thresholds, e.g. reject a >500% quantity delta; rolling median/MAD or z-score per-SKU baseline) is the detector and is expected to dominate the large majority of real anomalies (e.g., a 100x price error is caught by a `$0`/absurd-magnitude threshold rule, not by ML). AI is used only to explain a rule-triggered anomaly in plain language for the human reviewer — AI is never the thing that decides to block a sync. (BRule-9; Research: `ANOMALY_DETECTION.md`.)
