# Gate G — P08 Real Brand-Data Readiness

Verified 2026-08-30 by direct repository search. No data fabricated.

| Corpus type | Status | Evidence |
|---|---|---|
| Unicommerce-style export | **MISSING** | Unicommerce integration (`src/lib/unicommerce/`) is live-API-only; no sample/mock CSV or JSON export anywhere. `docs/research/brand-commerce-integration/02-unicommerce/FILE_IMPORTS.md` confirms Renivet has "no file/CSV/XLSX import pipeline" for Unicommerce today. |
| Shopify-style export | **MISSING** | Zero Shopify references anywhere in the repository. |
| Generic Excel/CSV (product data) | **MISSING** | Only CSVs found repo-wide are unrelated (marketing/analytics data, a corporate B2B `.xlsx` template, a Drizzle intent CSV). `product-import.tsx` accepts `.csv`/`.xlsx` uploads but ships no bundled sample/fixture file. |
| ERP-style export | **MISSING** | No ERP other than Unicommerce exists in the codebase; no export samples of any kind. |
| Messy real-world file | **MISSING** | None found anywhere. |
| Representative image sets | **MISSING** | No sample/seed brand-media directories exist; the one image-like fixture found (`tmp/pdfs/myntra-sample/page-1.png`) is an invoice-layout reference screenshot, not product media. |

`scripts/governance/fixtures/` exists but holds only governance/work-item YAML test data, unrelated to brand product data. `qa/TEST_DATA.md` states explicitly: "no test data has been created, seeded, or confirmed to exist," listing only two known-live product slugs for journey testing — no bulk/import-shaped data of any kind.

## What this means

**Every corpus type needed to validate P08's POC failure scenarios (malformed file, missing field, ambiguous column, unknown SKU, schema drift, etc. — per `docs/research/brand-commerce-integration/16-final/POC_PLAN.md`) is currently MISSING.** This is a genuine prerequisite gap, not a documentation gap: any P08 engineering work depending on parsing/normalizing/entity-resolving real brand exports has nothing to build or test against today.

## Required action before a POC can meaningfully run

Source at least one representative file per format (a real, anonymized brand export if a partner brand will share one; otherwise a deliberately realistic synthetic file per format, explicitly labeled as synthetic, not presented as real data) plus one representative image set. This is a data-sourcing task, not an engineering task, and should be sequenced before or alongside P08's authorization decision (Gate F), not after.
