# Component Architecture — P08

## Existing components this Epic extends (not replaces)

| Component | Current state | Extension in V1 |
|---|---|---|
| `product-import.tsx` (client-side XLSX/CSV importer) | Standalone, brand-admin-facing, no provenance, on vulnerable `xlsx@0.18.5` | Upgrade dependency; route output through shared write path; add mapping/validation/dry-run steps in front of it |
| `products.inventorySource` / `inventoryLastSyncedAt` | Product-level, inventory-only, enum `manual`/`unicommerce`/`order_adjustment` | Add a `file_import` enum value; generalize the column pair to variant/price/media as each is brought under provenance |
| `brandMediaItems` asset table | Correctly normalized, referenced by `products.media` | Reuse for File-First media writes; do not perpetuate `productVariants.image`'s raw-URL bypass in new code |
| Unicommerce OAuth2 sync | Real, production, inventory-only, per-brand | Unchanged beyond the F10 access-control fix in this Epic; catalog/orders/returns generalization is Phase 2, gated |
| `syncInventoryBySku` exact-match logic | Only existing identity-matching code path | Reused as the model for Phase 1's exact-match identity resolution — not replaced with fuzzy matching |

## New components in V1

| Component | Purpose | Notes |
|---|---|---|
| Shared write path | Single entry point for File-First writes so provenance/validation/logging apply uniformly | Existing Unicommerce sync does not need to be rerouted through this in V1 — it already writes correctly, just needs the access-control fix |
| Per-batch import log table | Minimal audit: file, brand, per-row outcome, timestamp, resulting IDs | Directly closes F7 for the File-First path only |
| Schema-mapping layer (deterministic + AI-assist) | Column-to-canonical-field resolution, one-time-or-deduped, human-confirmed | Alias dictionary maintained per canonical field; AI only for residual |
| Attribute-normalization layer | Value-to-canonical-value resolution, per-brand-scoped lookup table + AI on miss | Self-improving: AI-resolved values written back to the lookup table |
| Exact-match identity resolver | `sku` / `barcode` / normalized-title+attributes | No fuzzy logic in this component's write path |
| Suggest-only candidate queue | Persists unresolved rows with AI-ranked candidates for human review | Never writes without explicit human confirmation (BRule-1) |
| Dry-run diff generator | Computes matched/unchanged/changed/new/removed/ambiguous/invalid counts pre-write | Gate before any write |

## Components explicitly NOT built in V1 (see `10-roadmap/VERSION_TRIGGERS.md` for triggers)

- Generalized API connector abstraction (beyond the existing Unicommerce client)
- Scheduled/polling file ingestion
- Full reconciliation/confidence-review spine (drift detection across a full data set on independent cadence, audit-sampling surface, review-queue UI/dashboard)
- `brand_external_identifiers` multi-source identity-mapping table
- SKU-matching AI auto-apply (Tier 1/2 in the superseded confidence model)
- Webhook/SFTP/iPaaS/GS1 infrastructure

## Dependency notes

The per-batch import log and provenance extension are prerequisites for the (deferred) reconciliation spine and for "stale-since" drift computation — building them now in minimal form is explicitly the cheap, low-regret piece of an otherwise-deferred larger design. (Research: `14-critic/ANTI_OVERENGINEERING.md` Component 1.)
