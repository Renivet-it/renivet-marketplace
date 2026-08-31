# Business Rules — P08

## Identity and matching

- **BRule-1**: Identity/SKU matching never auto-applies at any confidence level. This is a hard rule, not a tunable threshold — even a very high-confidence AI-ranked candidate must pass through human confirmation. (Research: `08-ai-opportunities/AI_GUARDRAILS.md`; corrected/reaffirmed by `15-synthesis/SYNTHESIS.md` §2, superseding `CONFIDENCE_MODEL.md`'s original Tier 2 design.)
- **BRule-2**: Schema/column mapping always requires human confirmation before first use, regardless of AI confidence, because it is low-frequency and high-blast-radius — get it wrong once and every subsequent sync misapplies it. (Research: `08-ai-opportunities/SCHEMA_MATCHING.md`.)
- **BRule-3**: A confirmed schema mapping is versioned (new, effective-dated version), never silently overwritten, to preserve an audit trail across schema-drift corrections. (Research: `05-identity-and-mapping/SCHEMA_DRIFT.md`.)

## Data integrity

- **BRule-4**: A sync/import must never write null over previously-good data when an expected field disappears from a source — that sync hard-fails instead. (Research: `SCHEMA_DRIFT.md`.)
- **BRule-5**: Negative or non-numeric stock/price values are rejected outright, not coerced. (Research: `06-sync-and-reconciliation/` Validation.)
- **BRule-6**: Every write must carry `source` and `sourceRecordedAt` (or equivalent provenance) — a write with no provenance is not a valid write path in this system going forward. (BR-4.)

## Tenant isolation

- **BRule-7**: Every operation that reads or writes brand-scoped data must verify the acting user's own brand matches the target brand server-side; client-supplied brand identifiers are never trusted alone. (Research: F10, S1 — the rule the current 6 Unicommerce procedures violate.)

## AI use boundaries

- **BRule-8**: AI must never be the sole authority over stock quantities, prices, SKU identity, warehouse, tax, order state, or financial data. (Research: `AI_GUARDRAILS.md`, verbatim guardrail.)
- **BRule-9**: AI must never be the mechanism that decides to block a sync (anomaly detection); rules/statistical thresholds are the detector, AI may only explain a rule-triggered anomaly in plain language. (Research: `ANOMALY_DETECTION.md`.)

## Sequencing

- **BRule-10**: No Phase 2 component (generalized API-First, Scheduled-File, full reconciliation spine, SKU-matching auto-apply, `brand_external_identifiers`) is scheduled as engineering work until its specific named trigger fires. Do not build ahead of evidence. (Research: `14-critic/ANTI_OVERENGINEERING.md`; see `10-roadmap/VERSION_TRIGGERS.md` for the exact trigger list.)
- **BRule-11**: The F10 access-control fix proceeds independent of and not sequenced behind any architecture decision in this Epic. (BR-6.)
