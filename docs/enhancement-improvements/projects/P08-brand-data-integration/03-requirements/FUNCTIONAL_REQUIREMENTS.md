# Functional Requirements — P08 (V1 / File-First scope)

Numbered FR-x. Each traces to a business requirement (`02-business-customer/BUSINESS_REQUIREMENTS.md`) and research source. V2/V3 requirements are listed in `10-roadmap/V2.md` and `V3.md`, not here — this file is V1-scoped per the parent task's instruction that V1 = exactly the research's Phase 1 scope.

## Ingestion

- **FR-1**: The system shall accept a brand-uploaded file (extending `product-import.tsx`) covering product/catalog, SKU/variant, price, inventory, and media fields. (BR-1, BR-2; Research: `16-final/RECOMMENDED_ARCHITECTURE.md`.)
- **FR-2**: The `xlsx` dependency must be upgraded off the vulnerable `0.18.5` version before or as part of extending the importer. (Research: F9, S5; re-verified still unfixed, `00-context/CURRENT_STATE.md`.)
- **FR-3**: The importer shall route through a single shared write path rather than remaining a standalone brand-admin tool disconnected from provenance/validation. (Research: `16-final/POC_PLAN.md` step 3.)

## Schema and value mapping

- **FR-4**: The system shall perform deterministic column mapping first: normalized exact match against a maintained alias dictionary. (Research: `05-identity-and-mapping/SCHEMA_MAPPING.md`.)
- **FR-5**: For columns the deterministic layer cannot resolve, the system shall use AI-assisted mapping suggestions, but shall always require human confirmation before the mapping is used for the first time, regardless of AI confidence. (BR-5; Research: `08-ai-opportunities/SCHEMA_MATCHING.md`, `AI_GUARDRAILS.md`.)
- **FR-6**: Once a column mapping is confirmed, subsequent uploads from the same brand/source shall reuse it deterministically (no re-prompting, no AI on the hot path) until schema drift is detected. (Research: `05-identity-and-mapping/SCHEMA_MAPPING.md` Phase 2.)
- **FR-7**: The system shall deduplicate distinct attribute values (size, color, category) within a batch and resolve them against a **per-brand-scoped** lookup table before invoking AI; AI-resolved values shall be written back into the lookup table. (Research: `08-ai-opportunities/ATTRIBUTE_NORMALIZATION.md`; per-brand-scoping correction: `15-synthesis/SYNTHESIS.md` §6.)
- **FR-8**: The system shall detect schema drift: a previously-unseen column is flagged "unmapped, ignored" and surfaced for review; a previously-expected column that disappears causes that sync to hard-fail rather than writing nulls over existing good data. (Research: `05-identity-and-mapping/SCHEMA_DRIFT.md`.)

## Identity resolution

- **FR-9**: The system shall resolve product/variant identity using exact-match only in Phase 1: exact `sku`, exact `barcode`, or exact normalized-title + full variant-attribute match. (BR-5; Research: `05-identity-and-mapping/ENTITY_RESOLUTION.md` Tier 1.)
- **FR-10**: Rows that do not resolve via exact match shall be held in a persisted, reviewable queue — never silently discarded (correcting today's `missingSkus` behavior) and never auto-matched via fuzzy/AI logic. (BR-5; Research: `ENTITY_RESOLUTION.md`; corrects F7-adjacent current behavior.)
- **FR-11**: The system may present AI-ranked fuzzy match candidates for held rows as suggestions only; a human must confirm or reject every suggestion before any write occurs. No fuzzy/AI-assisted match writes automatically at any confidence level. (BR-5; Research: `15-synthesis/SYNTHESIS.md` §2 — the corrected position.)

## Validation and dry run

- **FR-12**: The system shall validate structural/type correctness, referential integrity against `brandId` (never allow cross-brand row writes), sane value ranges (reject negative price/quantity), and cross-field consistency before any write. (Research: `06-sync-and-reconciliation/` Validation.)
- **FR-13**: Before writing, the system shall produce a dry-run diff showing matched/unchanged/changed/new/removed/ambiguous/invalid counts, and require explicit brand approval to proceed. (BR-3; Research: `DRY_RUN.md`.)

## Write and provenance

- **FR-14**: Every write from a File-First import shall record `source` and `sourceRecordedAt` on the affected row, generalizing the existing `products.inventorySource`/`inventoryLastSyncedAt` pattern to variant/price/media scope as needed. (BR-4; Research: F4; `04-data-model/`.)
- **FR-15**: The system shall record a minimal per-batch import log: file, brand, rows succeeded/failed, timestamp, resulting row IDs. (BR-4; Research: F7; `14-critic/ANTI_OVERENGINEERING.md`.)
- **FR-16**: A partially-failed batch shall produce per-row results, not one overwritten status field; a retried batch shall not double-write already-succeeded rows. (Research: `06-sync-and-reconciliation/` Failure Handling, Retry/Replay.)

## Security (independent of architecture, still V1-scoped because it is a live defect)

- **FR-17**: Every Unicommerce brand-settings tRPC procedure shall verify that the brand identified by server-derived caller context matches the brand the operation targets, using the same pattern already correct elsewhere in the codebase (`brand-product-type-packing.tsx`). (BR-6; Research: F10, S1.)

## Explicitly not functional requirements of V1

Generalized non-Unicommerce API ingestion; scheduled/polling file ingestion; the full reconciliation/confidence-review spine; SKU-matching auto-apply; a multi-source `brand_external_identifiers` table; webhook/SFTP/iPaaS/GS1 ingestion. See `10-roadmap/V2.md`, `V3.md`, `VERSION_TRIGGERS.md`.
