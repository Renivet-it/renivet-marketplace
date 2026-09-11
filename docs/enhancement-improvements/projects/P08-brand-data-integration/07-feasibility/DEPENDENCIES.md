# Dependencies — P08

## Hard prerequisite, independent of architecture

- **F10 fix** (Unicommerce brand-settings access-control gap) — should ship before or alongside V1, not sequenced behind it, since it's a live production defect unrelated to the ingestion-mechanism decision (BRule-11). This package recommends resolving the legacy global-env-var vs. per-brand-DB credential question (F8, UNKNOWN) as part of implementing this fix, since both touch the same credential-handling surface.

## Precondition Renivet must gather directly (not more research, not engineering)

- **Actual brand-tier distribution** across ~50 brands (spreadsheet-only / export-capable / API-capable) — the single most load-bearing unmeasured input in the entire program. This does not block V1 (File-First serves any brand regardless of tier), but it is the deciding input for whether Phase 2's Scheduled-File or generalized API-First tiers ever have a justified trigger. See `10-roadmap/VERSION_TRIGGERS.md`.
- **Human-review staffing/ownership decision** — see `07-feasibility/RESOURCE_ASSESSMENT.md`.

## Engineering-decision dependencies (informed by data this program doesn't have)

- `pg_trgm` availability in Renivet's Postgres — needed before any Phase 2 fuzzy-matching work, UNKNOWN today.
- Embedding model identity and fitness for identity discrimination (`products.embeddings`, `semanticSearchEmbeddings`) — needed before any Phase 2 SKU-matching-candidate work, UNKNOWN today.
- Legacy global-env-var Unicommerce credential model vs. per-brand DB model — needed before the F10 fix ships cleanly (see above), UNKNOWN today.

## Sequencing dependencies within V1

- The `xlsx` dependency upgrade (FR-2) should land before or with the importer extension work (FR-1/FR-3), not after — no reason to build new functionality on top of a confirmed-vulnerable parsing library.
- The provenance schema migration (FR-14) and import-batch/import-record tables (`06-data/DATA_REQUIREMENTS.md`) should land before the write-path work, since the write path's contract (FR-14, FR-15) depends on these tables existing.
- Schema-mapping and attribute-normalization AI-assist (FR-5, FR-7) depend on the deterministic layers (FR-4, alias dictionary; per-brand lookup table) existing first — AI is explicitly the residual-handling layer, not the first layer built.

## Dependency on Phase 2 components (none — that's the point)

By design, no V1 functional requirement depends on any Phase 2 component existing. This is what makes the "gated, not scheduled" sequencing in `10-roadmap/VERSION_TRIGGERS.md` safe — V1 is a complete, shippable, valuable slice on its own.
