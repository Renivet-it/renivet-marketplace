# Business Requirements — P08

## BR-1: Vendor-neutral ingestion for heterogeneous brand systems

Renivet must be able to bring in product, inventory, price, and media data from brands regardless of whether they run a spreadsheet, an ERP, Shopify/WooCommerce, or Unicommerce, without requiring every brand to adopt a new system. (Research: `00-orchestration/RESEARCH_CHARTER.md`.)

## BR-2: Serve the majority brand population first, cheaply

The ingestion mechanism built first must serve the largest plausible slice of Renivet's brand population at the lowest brand-side and engineering cost, without waiting on unmeasured demand for higher-effort tiers. (Research: `13-option-comparison/COMPARISON_MATRIX.md`; `14-critic/ANTI_OVERENGINEERING.md`.)

## BR-3: No silent data corruption of live listings

Brand-supplied source data must never silently overwrite what customers see. A brand operator must be able to preview exactly what will change before it changes. (Research: `06-sync-and-reconciliation/DRY_RUN.md`.)

## BR-4: Traceable provenance

Every value Renivet holds that came from a brand-supplied source must be traceable to where it came from and when — extending, not replacing, the existing `products.inventorySource`/`inventoryLastSyncedAt` pattern. (Research: `04-data-model/`, F4.)

## BR-5: Never guess brand/customer-facing identity

SKU and product identity matching must never be silently auto-corrected by an algorithm or AI at any confidence level. A wrong identity match (matching the right product but the wrong size/color variant) is the costliest failure mode this Epic must guard against, and it is also the hardest for a human to catch after the fact because the data still "looks correct." (Research: `08-ai-opportunities/AI_GUARDRAILS.md`; `15-synthesis/SYNTHESIS.md` §2.)

## BR-6: Fix the live cross-brand security gap independent of architecture

The verified HIGH-severity access-control gap in the existing Unicommerce brand-settings procedures (F10) is a live production defect independent of any architecture decision in this Epic and must not wait on this program's roadmap sequencing. (Research: F10; `11-security-compliance/`; portfolio: `08-risks/PORTFOLIO_RISK_REGISTER.md` DEF-010 cross-reference.)

## BR-7: Don't build ahead of evidence

Components with no named brand demand today (generalized API-First beyond the existing Unicommerce connector, a scheduled-file tier, the full reconciliation/confidence-review spine, SKU-matching auto-apply) must not be scheduled as engineering work until their specific, named trigger fires. (Research: `14-critic/ANTI_OVERENGINEERING.md`; `10-roadmap/VERSION_TRIGGERS.md`.)

## Out of scope (explicit)

Orders, fulfillment, returns, and any OMS/ERP-replacement functionality are out of scope for the entire research program and remain out of scope here. (Research: `16-final/FINAL_RESEARCH.md` Q12.)
