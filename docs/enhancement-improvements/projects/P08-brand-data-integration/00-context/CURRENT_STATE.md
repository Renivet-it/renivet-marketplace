# Current State — P08

All items below are corrected/superseded findings where noted; later waves in the research corrected earlier waves' first impressions. Classifications (CONFIRMED / INFERRED / UNKNOWN) are preserved from source.

## Confirmed as of this package (2026-08-30 direct code/config check, independent of the original research pass)

| Item | Research claim | Verified now | Source |
|---|---|---|---|
| `xlsx` dependency version | `0.18.5`, vulnerable | **Still `^0.18.5`** in `package.json` — unchanged | `package.json:137`; Research F9 |
| F10 access-control gap | 6 Unicommerce brand-settings tRPC procedures check only a permission bitfield, never compare `input.brandId` to caller's brand | **Still present** — `getUnicommerceIntegration`, `upsertUnicommerceIntegration`, `authenticateUnicommerceIntegration`, `runUnicommerceApiRequest`, `testUnicommerceIntegration`, `triggerUnicommerceSync` in `src/lib/trpc/routes/brands/brands.ts` all gate on `isTRPCAuth(BitFieldBrandPermission.ADMINISTRATOR, "all", "brand")` only; `input.brandId` is read and used directly with no comparison against `ctx.user.brand.id` | `src/lib/trpc/routes/brands/brands.ts:187-650` (direct read); Research `01-renivet-current-state/FINDINGS.md` F10, `11-security-compliance/` S1 |

Neither item has moved since the research was written. This package does not fix either — per the parent task's read-only scope, defects are documented, not remediated.

## Existing production capability

1. **Unicommerce inventory sync** (F1) — real, OAuth2, encrypted per-brand credentials, cron + manual trigger, transactional per-brand writes, correct token-refresh-with-fallback pattern. Inventory-only.
2. **Unicommerce catalog/orders/returns "API Explorer"** (F2) — an unpersisted raw API passthrough. Signals recognized-but-stopgapped need, not a real integration.
3. **XLSX/CSV bulk importer** (`src/components/dashboard/brands/products/product-import.tsx`, F9/S5) — client-side parsing only (limits server-side attack surface), brand-admin-facing, not wired to any provenance or shared write path. On outdated `xlsx@0.18.5`.
4. **Partial provenance** (F4, corrected from Wave 0) — `products.inventorySource` / `inventoryLastSyncedAt` (enum: `manual` / `unicommerce` / `order_adjustment`) exist today, scoped to `products` only, inventory only — not variants, not price, not media.
5. **Partial media normalization** (F4) — `brandMediaItems` is a real asset table; `products.media` references it correctly via `{id, position}` entries; `productVariants.image` bypasses it with a raw text URL.
6. **Identity fields** (F5, resolved by Wave 4) — `sku` (nullable, non-unique, brand-scoped) is the only field actually used for matching today (`syncInventoryBySku`, exact string equality). `nativeSku` is system-generated and unique but cannot serve as an external mapping target. `barcode` exists on both tables but is unused by any matching code.
7. **Discarded Unicommerce sub-fields** (F6) — `openSale`, `openPurchase`, `putawayPending`, `inventoryBlocked`, `pendingStockTransfer`, `vendorInventory`, `virtualInventory`, `pendingInventoryAssessment` are fetched in API responses today and thrown away; only total `inventory` persists.
8. **Failure/observability** (F7) — one overwritten status/error field per brand; no per-SKU detail; no history.
9. **Legacy credential model** (F8, UNKNOWN) — a second, global-env-var Unicommerce credential model coexists with the per-brand DB model; which is authoritative was out of scope for the read-only research pass and remains unresolved (see `07-feasibility/DEPENDENCIES.md`).
10. **No bulk catalog ingestion path exists at all** — the only way to create a product today, outside the XLSX importer, is one-at-a-time dashboard creation. (Research: `07-catalog-and-media/`.)
11. **No reconciliation, dry-run, retry, or audit trail exists** for any sync path today beyond OAuth 401/403 retry-then-refresh. (Research: `06-sync-and-reconciliation/`.)

## What does NOT exist and is not assumed

- No SFTP, webhook, or scheduled-file ingestion of any kind.
- No multi-warehouse/location inventory dimension (a single optional brand address is the only location concept in the schema).
- No historical/point-in-time inventory log — every quantity write is destructive.
- No `brand_external_identifiers` or equivalent multi-source identity-mapping table.

## Zero Linear tracking

No REN-### issue references this Epic. See `12-traceability/AUDIT_TO_EPIC.md`.
