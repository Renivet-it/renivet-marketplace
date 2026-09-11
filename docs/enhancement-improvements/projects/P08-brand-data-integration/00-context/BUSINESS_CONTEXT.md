# Business Context — P08

## The business problem

Renivet is a multi-brand marketplace. Brands supply product, inventory, price, and media data from whatever system they already run — a spreadsheet, an ERP, Shopify/WooCommerce, or an OMS/WMS like Unicommerce. Renivet cannot require every brand to adopt a new system, and no single ingestion mechanism ("everyone uploads one file format" or "everyone integrates via API") works structurally for a heterogeneous brand population. (Research: `00-orchestration/RESEARCH_CHARTER.md`, `16-final/EXECUTIVE_SUMMARY.md`.)

## What exists today (see `CURRENT_STATE.md` for full detail)

- A real, production, per-brand Unicommerce inventory-sync integration (OAuth2, encrypted credentials, cron + manual trigger) — **inventory-only**; catalog/orders/returns are a raw, unpersisted API tester.
- A client-side XLSX/CSV bulk product importer (`product-import.tsx`) — brand-admin-facing, not connected to the Unicommerce path, running on a vulnerable `xlsx@0.18.5` dependency.
- Partial provenance: `products.inventorySource` / `inventoryLastSyncedAt`, product-level and inventory-only.
- Partial media normalization: a real `brandMediaItems` asset table, inconsistently bypassed by `productVariants.image`'s raw text URL.
- A **CONFIRMED, still-unfixed, HIGH-severity** cross-brand access-control gap in the Unicommerce settings procedures (F10) — see `08-reliability/SECURITY.md`.

## Why now

This is the single most-researched, least-tracked Epic in the portfolio: 16 completed research waves, zero Linear issues. (See `12-traceability/AUDIT_TO_EPIC.md`.) The business risk is not "we don't know what to build" — the architecture question is answered — it is that a fully-scoped, adversarially-reviewed recommendation exists and nothing has been authorized to act on it, while a live security defect sits in production untouched.

## What success looks like (business terms)

A brand operator who only has a spreadsheet can bring their catalog, inventory, price, and images into Renivet without engineering help, see what will change before it changes (dry-run), understand why something couldn't be automatically mapped, and trust that Renivet never silently overwrites their live listings with bad source data. See `02-business-customer/USER_STORIES.md`.

## What this Epic explicitly does not attempt

Orders, fulfillment, returns, or any OMS/ERP-replacement functionality — these are out of scope for the entire research program and stay out of scope here (Research: `16-final/FINAL_RESEARCH.md` Q12). This Epic is about getting brand-supplied *data* into Renivet's canonical model, not about running a brand's operations.

## Stakeholders

- **Brand operators** (see personas in `02-business-customer/PERSONAS.md`) — the direct users of any ingestion UI.
- **Renivet catalog/brand-ops staff** — the unnamed, currently-unstaffed owner of manual-mapping escalation once File-First runs at volume (Research: `10-performance-cost-reliability/OPERATIONAL_MODEL.md`; see `07-feasibility/RESOURCE_ASSESSMENT.md`).
- **Renivet engineering** — owns the independent, non-architecture-dependent fix for F10.
- **Renivet leadership** — has not yet made the greenlight decision to convert this research into tracked engineering work (see `99-final/GO_NO_GO.md`).
