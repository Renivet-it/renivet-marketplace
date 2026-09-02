# Corporate Invoice Tax Lines Design

## Goal

Make corporate customer documents show base goods and customisation as separate lines, calculate apparel GST from the net per-piece goods value, collect a manual-quote customer GSTIN without format validation, and prevent invalid proforma dates.

## Scope

- Corporate customer-facing proforma invoices and corporate tax invoices.
- Manual corporate quote creation, its order snapshot, and document rendering.
- Corporate tax calculation and the GST export inputs derived from the order.

## Document lines

When an order has a non-zero customisation charge, documents that display customisation will render two rows:

1. The base garment row contains product description, HSN, quantity, the net base unit price, base taxable value, the rate determined from that net base unit price, base GST, and its inclusive total.
2. The customisation/extras row contains its own description, charge, taxable value, GST rate, GST, and inclusive total. It must not inflate the unit value used to select the garment GST rate.

Documents without customisation retain their existing single garment row. Summaries continue to show separate base and customisation totals, sourced from the same split amounts as the item table.

## GST calculation

For an apparel HSN with a threshold rule, select the goods GST rate from the net base-garment transaction value per piece (`subtotalPaise / quantity`), excluding GST and customisation. Never use an order-level taxable total or a customisation-inclusive unit value for that decision. The customisation line has its own rate and tax amount, persisted in the quote/order snapshot so rendering, totals, and GST exports agree. Existing explicit HSN/rate configuration remains the fallback for HSNs that do not use the apparel threshold rule.

## Manual quote and date

The manual quote form provides a Customer GSTIN input. It accepts user-entered text without GSTIN regex validation and passes it through to the corporate order and company snapshot. The proforma renderer uses the persisted issue date; if an older record lacks a usable date, it uses the stored creation date, then a safe current-date fallback. It must never pass an invalid Date to a formatter.

## Error handling and compatibility

Existing orders may lack split customisation tax data. Renderers derive a backward-compatible split from stored taxable and tax totals while all new manual quotes persist explicit values. Missing customer GSTIN remains displayable as not provided; it is not blocked or validated by the quote form.

## Testing

Add focused Bun tests for rate selection using net base per-piece value, split customisation line/totals construction, and safe proforma date formatting. Exercise the manual quote input schema/mutation payload so unvalidated GSTIN text is retained. Run `bun test` for the repository and render the corporate document preview to inspect both rows and a valid date.
