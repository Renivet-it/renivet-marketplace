# Algorithm Evaluation — P08

No empirical evaluation has been run against Renivet's real data for any matching or mapping algorithm in this Epic — this is a design package, not a POC report. This file states what evaluation the research recommends and what remains genuinely unknown.

## What is NOT yet measured (UNKNOWN, not merely undocumented)

- False-positive/false-negative rates for fuzzy/similarity-based SKU matching at the proposed 0.90/0.75 thresholds — explicitly labeled INFERRED in source, never measured against Renivet data. (Research: `CONFIDENCE_MODEL.md` §5.)
- Whether `pg_trgm` is enabled in Renivet's Postgres instance — required for trigram similarity matching, not checked in the read-only research pass. (Research: `01-research/EVIDENCE_INDEX.md`.)
- Which embedding model populates `products.embeddings` (384-dim), `searchSuggestionEmbeddings` (384-dim), and `semanticSearchEmbeddings` (768-dim), and whether a model tuned for search relevance is fit for identity discrimination — a genuinely different task. (Research: `05-identity-and-mapping/SKU_IDENTITY.md`.)
- The real distribution of distinct raw attribute values per brand (the "tens of distinct strings per 5,000 SKUs" estimate is reasoned, not measured, though plausible).

## What evaluation V1 should produce as a byproduct (without building a Phase 2 evaluation harness)

Because V1 persists a reviewable queue for unmatched rows (FR-10) and logs AI-assisted mapping decisions with confidence and human outcome (NFR-7), running V1 in production for even a modest volume of brand uploads generates the first real match-data set the research says doesn't exist yet. This is precondition (a) of the Tier 2 re-enablement gate in `05-algorithms/DECISION_LOGIC.md` — V1's logging design is deliberately what eventually funds a V3 decision, not an accident.

## Recommended evaluation approach once real data exists (Phase 2/V3 scope, not V1 build work)

1. Sample confirmed/rejected human decisions on Tier 3/4 candidates from V1's queue.
2. Compute actual precision/recall of the fuzzy-matching signal at varying thresholds against those human-confirmed labels.
3. Specifically measure cross-variant confusion rate (same brand/title/price, wrong size/color) as its own metric, since this is the failure mode the corroboration-signal design was found weakest against (`11-critique/` / `05-algorithms/DECISION_LOGIC.md`).
4. Only after this data exists does re-evaluating Tier 2 auto-apply become a defensible engineering decision rather than a repeat of the original unvalidated proposal.

## Algorithm evaluation is explicitly not a V1 deliverable

Building a threshold-tuning or precision/recall dashboard is Phase 2/V3-adjacent tooling and is not scoped into V1 per the anti-overengineering discipline applied throughout this package (NFR-10). V1's job is to generate the data honestly, not to analyze it with dedicated tooling yet.
