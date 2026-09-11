# Golden Dataset — P08 AI Benchmark

## Why this dataset is synthetic, and why that's the honest choice

The prior execution-readiness pass (Gate G) confirmed **zero real brand-export corpora exist anywhere in the Renivet repository** — no Unicommerce export, Shopify export, generic Excel/CSV, ERP export, messy real file, or sample image set. Per this benchmark's own instruction ("If insufficient real examples exist: document the missing dataset instead of inventing truth"), this dataset is built as **representative synthetic examples of common e-commerce column-header and attribute-value variation**, not presented as scraped real brand data. What IS real: every canonical target is taken directly from Renivet's current schema (`src/lib/db/schema/product.ts`), not invented.

## Schema mapping (13 examples)

Canonical targets: `quantity`, `price`, `sku`, `barcode` — the only relevant `productVariants` fields with a direct external-mapping meaning. **Important correction to the source prompt's illustrative example:** Renivet's schema has a single flat `quantity` field, not a 3-way `inventory.available`/`inventory.reserved`/`inventory.blocked` split — that split exists in Unicommerce's API response shape (per prior research Wave 0 F6) but is fetched-and-discarded, not modeled in Renivet's DB. The golden dataset reflects the real schema, not the source prompt's example.

| Source value | Canonical target | Reason |
|---|---|---|
| Available Qty | quantity | direct synonym |
| Sellable Quantity | quantity | direct synonym |
| Stock Available | quantity | direct synonym |
| Current Inventory | quantity | direct synonym |
| ATP | quantity | industry abbreviation (Available-To-Promise), collapses to the single quantity field |
| On Hand | quantity | common WMS/ERP term |
| MRP | price | Indian-market term; ambiguous vs. compareAtPrice without a business rule — included as a genuine edge case |
| Selling Price | price | direct synonym |
| Vendor SKU | sku | direct synonym |
| EAN | barcode | barcode standard |
| UPC | barcode | barcode standard |
| Warehouse Location | UNRESOLVED | no corresponding field exists — correctly unresolved |
| Season Code | UNRESOLVED | no corresponding field exists — correctly unresolved |

## Attribute normalization (8 examples)

Canonical targets are brand/product-defined free text (`productOptions.values`), not a fixed system-wide taxonomy — ground truth here means "these strings should collapse to the same canonical value for matching purposes," a defensible synthetic standard given no real brand attribute data exists to draw from.

| Source value | Canonical target | Reason |
|---|---|---|
| Blk | Black | abbreviation |
| BLACK | Black | case variant |
| Jet Black | Black | brand-naming variant — included as a genuine edge case (a strict normalizer could argue this is a distinct shade) |
| XL | Extra Large | abbreviation |
| X-Large | Extra Large | punctuation variant |
| Extra-Large | Extra Large | punctuation variant |
| Navy Blue | UNRESOLVED | genuinely distinct color — negative/false-positive test case |
| Onesize | One Size | spacing variant |

## What this dataset does NOT cover

SKU-candidate matching (task C) is not separately benchmarked here — constructing a realistic golden set requires real or realistic product-title/variant text at catalog scale, which doesn't exist (same Gate G finding). The calibration concerns this benchmark found in schema mapping (see `EMBEDDING_BENCHMARK.md`) are cited as directionally relevant to task C by extension, not as a direct measurement of it.
