# Build / Reuse / Buy / Simplify — P08

## BUILD

- Minimal provenance extension (import-batch + import-record tables, `source`/`sourceRecordedAt` generalization).
- Exact-match identity resolution logic.
- Schema-mapping and attribute-normalization AI-assist layers (narrow, human-confirmed).
- Suggest-only SKU candidate queue.
- F10 access-control fix.

## REUSE (extend existing Renivet capability rather than build new)

- `product-import.tsx` — extend, don't replace, after the `xlsx` upgrade.
- `products.inventorySource`/`inventoryLastSyncedAt` — generalize the pattern, don't invent a new one.
- `brandMediaItems` asset table — reuse for File-First media writes.
- Existing Unicommerce OAuth2 sync — unchanged beyond the F10 fix; not rebuilt.
- `syncInventoryBySku`'s exact-match logic — the model for V1's identity resolver, not replaced with something more complex.
- Existing `productQcFindings` error shape (`code`, `severity`, `field`, `title`, `description`, `suggestion`) — reused for import validation errors rather than inventing a new error contract (Research: `07-catalog-and-media/`).
- Existing embedding infrastructure (`products.embeddings`, `semanticSearchEmbeddings`) — reserved as a Phase 2 asset for fuzzy identity candidate ranking, once its fitness for that purpose is verified.

## BUY

**Rejected.** `13-option-comparison/` evaluated integration-platform/iPaaS options (Option D) explicitly and rejected them: no confirmed native Unicommerce connector on the evaluated platforms, and Renivet would still build the hard integration work itself, just inside a costlier ($100-5,000+/mo, third-party-sourced estimates), higher-lock-in tool. No BUY option is recommended anywhere in this Epic.

## SIMPLIFY (what the research explicitly cut down from a fuller original design)

- The full "shared spine" (canonical ingest interface + provenance + validation + reconciliation + confidence-tier queues + audit trail + audit-sampling) was simplified to: minimal provenance extension + exact-match resolution + suggest-only queue. The full spine is Phase 2, gated (`14-critic/ANTI_OVERENGINEERING.md`).
- The attribute-normalization lookup table was simplified from a proposed global table to a per-brand-scoped table (`15-synthesis/SYNTHESIS.md` §6) — smaller blast radius, same mechanism.
- The identity confidence model was simplified from a 4-tier auto-apply/review split to a 2-outcome model for V1: exact match auto-resolves, everything else is human-reviewed — no Tier 2 auto-apply-with-audit-sampling (`05-algorithms/DECISION_LOGIC.md`).
- Multi-warehouse inventory was simplified to a single nullable future-proofing column, not a location dimension — zero evidence of demand today.

## Net assessment

V1 is almost entirely REUSE + narrow BUILD. No BUY option survives evaluation. The SIMPLIFY decisions are the most consequential design choices in the whole package — each one traces to a specific critic-pass finding, not an arbitrary cut.
