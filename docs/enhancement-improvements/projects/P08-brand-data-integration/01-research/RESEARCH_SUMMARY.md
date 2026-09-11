# Research Summary — P08

Source: `docs/research/brand-commerce-integration/` (00-orchestration through 16-final, 16 waves, 4-document critic pass, 1 synthesis). This is a summary index, not a replacement — go to the cited wave for full detail.

## Wave-by-wave map

| Wave | Directory | What it established |
|---|---|---|
| 0 | `01-renivet-current-state/` | F1-F10: what Renivet actually has today (see `00-context/CURRENT_STATE.md`) |
| 1 | `02-unicommerce/` | Unicommerce's documented capability surface vs. what Renivet uses |
| 2 | `03-alternative-architectures/` | 8 ingestion mechanisms scored independently |
| 3 | `04-data-model/` | Canonical product/variant/inventory/price/media/provenance model, corrected Wave 0's provenance framing |
| 4-5 | `05-identity-and-mapping/` | SKU/identity resolution design, confidence-tier model (later corrected), schema-mapping/drift design |
| 6 | `06-sync-and-reconciliation/` | Reconciliation, dry-run, audit trail, failure handling, retry/replay, validation design |
| 7 | `07-catalog-and-media/` | Catalog ingestion pipeline, variant/option normalization, media normalization |
| 8 | `08-ai-opportunities/` | 8 AI use cases scored, hard guardrails established |
| 9 | `09-brand-onboarding/` | Brand personas (all INFERRED), two-front-door onboarding flow |
| 10 | `10-performance-cost-reliability/` | Performance estimates, reliability gap ranking, operational/staffing model |
| 11 | `11-security-compliance/` | F10/S1 verified by direct code trace; S2-S5 |
| 12 | `12-industry-research/` | Comparable-marketplace and standards-body patterns |
| 13 | `13-option-comparison/` | Comparison matrix across all 8 mechanisms, pending critic review |
| 14 | `14-critic/` | Four-document adversarial critique of the entire program |
| 15 | `15-synthesis/` | Resolved the Tier 2 AI contradiction; final scoped recommendation |
| 16 | `16-final/` | Executive summary, final Q&A (25 questions), recommended architecture, POC plan, open questions |

## The single most important correction the research made to itself

`05-identity-and-mapping/CONFIDENCE_MODEL.md`'s original design (Wave 4/5) proposed a "Tier 2 — Corroborated fuzzy" match category that would **auto-apply, flagged for audit sampling**. `14-critic/AI_CRITIQUE.md` found this directly contradicts three earlier documents (`AI_USE_CASES.md`, `AI_GUARDRAILS.md`, `SKU_MATCHING.md`, all Wave 7-8) which state identity/SKU matching must never auto-apply "at any confidence." `15-synthesis/SYNTHESIS.md` §2 resolves this in favor of the guardrail: **any fuzzy/AI-assisted identity match — Tier 2 included — is treated as Tier 3: queued for human confirmation, never auto-written**, until real match data, provenance, and pin-once persistence all exist. This package states the corrected position throughout and preserves the superseded position only where explicitly labeled as superseded (see `05-algorithms/CURRENT_ALGORITHM.md` and `11-critique/ARCHITECTURE_CRITIQUE.md`).

## What the critic pass changed vs. left standing

- **Left standing, unconditionally**: File-First ingestion as Phase 1 (no dissent anywhere in the critic pass); schema/attribute-normalization AI assistance as designed; anomaly-detection-as-explanation-only.
- **Corrected**: SKU-matching Tier 2 auto-apply → demoted to suggest-only (above).
- **Scoped down, not rejected**: the full Hybrid architecture — sequenced so only File-First + minimal provenance + exact-match + schema/attribute AI ship now; everything else gated on named triggers (see `10-roadmap/VERSION_TRIGGERS.md`).
- **Minor fix carried forward**: the attribute-normalization lookup table must be per-brand-scoped, not global (`15-synthesis/SYNTHESIS.md` §6).

## What remains open

See `01-research/EVIDENCE_INDEX.md` for classification of every claim and `99-final/OPEN_DECISIONS.md` for what still needs a Renivet decision.
