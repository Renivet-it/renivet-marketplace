# Evidence Index — P08

Classification discipline per the research program's own standard. This index exists so that no claim in this package is read with more confidence than the source evidence supports.

## CONFIRMED (verified by direct code trace or direct config/dependency check)

| Claim | Evidence | Source |
|---|---|---|
| Unicommerce inventory sync is real, production, OAuth2, per-brand, encrypted, cron+manual | Direct code trace | F1 |
| Catalog/Orders/Returns Unicommerce UI is unpersisted passthrough | Direct code trace | F2 |
| `products.inventorySource`/`inventoryLastSyncedAt` exist, product-level, inventory-only | Direct schema trace | F4 |
| `brandMediaItems` is a real normalized asset table; `productVariants.image` bypasses it with raw text | Direct schema trace | F4 |
| `sku` (not `nativeSku`) is the field actually used for matching (`syncInventoryBySku`) | Direct code trace | F5 |
| Unicommerce sub-fields fetched and discarded | Direct code trace | F6 |
| One overwritten status field, no per-SKU history | Direct code trace | F7 |
| `product-import.tsx` exists, client-side XLSX/CSV, brand-admin-facing | Direct code trace | F9 |
| **F10: 6 Unicommerce brand-settings procedures check only a permission bitfield, never brand ownership** | Direct code trace, re-verified independently by this package 2026-08-30 against `src/lib/trpc/routes/brands/brands.ts:187-650` | F10; S1; `00-context/CURRENT_STATE.md` |
| `xlsx@0.18.5` still in `package.json`, unchanged since research was written | Direct dependency check, re-verified by this package | F9; S5 |
| Correct ownership-check pattern exists elsewhere in the same codebase (`brand-product-type-packing.tsx`) | Direct code trace | S1 |

## INFERRED (reasoned from evidence, not directly measured against Renivet's real population)

| Claim | Why it's inferred, not confirmed | Source |
|---|---|---|
| Brand personas (Priya, Rahul, Ananya, Karan) | "No claim here describes an actual named Renivet brand" | `09-brand-onboarding/PERSONAS.md` |
| Brand-tier distribution assumption (majority spreadsheet-only) | Never checked against Renivet's actual ~50-brand roster | `14-critic/BUSINESS_CRITIQUE.md` Q2 |
| 0.90/0.75 similarity thresholds in the (superseded) confidence model | "A starting proposal, not derived from any authoritative source" | `CONFIDENCE_MODEL.md` §5 |
| Comparable-marketplace convergence on tiered onboarding | Industry pattern (Faire/Etsy/Ankorstore-type), not a Renivet-specific study | `12-industry-research/` |
| Performance estimates (50-150s per hourly sync run) | Explicitly labeled ESTIMATE, not measured | `10-performance-cost-reliability/` |

## UNKNOWN (explicitly unresolved, named precondition for later decisions)

| Claim | Why unresolved | Who resolves it |
|---|---|---|
| **Actual brand-tier distribution** (spreadsheet-only / export-capable / API-capable) across ~50 brands | Never measured — the single most load-bearing unmeasured input across the whole program | Renivet business/ops, direct inventory — not more research |
| Who owns manual-mapping/review-queue staffing once File-First runs at volume | No current owner or SLA identified anywhere in the org | Renivet leadership |
| Which of the two Unicommerce credential models (global env-var vs. per-brand DB) is authoritative | Out of scope for read-only research pass | Renivet engineering, before F10 fix ships |
| Whether `pg_trgm` is enabled in Renivet's Postgres | Not checked in the read-only pass | Renivet engineering |
| Which embedding model populates `products.embeddings`/`semanticSearchEmbeddings`, and its fitness for identity discrimination (not just search relevance) | Not investigated | Renivet engineering, before any Phase 2 SKU-matching work |

## Package-level additions (not in the original research, added by this package)

- The DEF-010 cross-reference in `08-reliability/SECURITY.md` and `11-critique/` (sourced from `docs/enhancement-improvements/08-risks/PORTFOLIO_RISK_REGISTER.md`, itself INFERRED as "likely same defect class," not proven identical).
- The 2026-08-30 direct re-verification that F10 and the `xlsx` version are unchanged (see `00-context/CURRENT_STATE.md`).
- The RDBMS-design comparison in `06-data/DATA_REQUIREMENTS.md` (staging-table / import-batch+import-record / change-set-event / hybrid) — the research's `04-data-model/` and `06-sync-and-reconciliation/` establish the requirements this comparison is built from, but the explicit side-by-side comparison and V1 recommendation are this package's synthesis on top of that requirement set, per the parent task's explicit ask.
