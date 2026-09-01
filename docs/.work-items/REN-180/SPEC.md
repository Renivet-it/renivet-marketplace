# REN-180 — Corporate document data integrity

## Outcome

Corporate PI, tax invoice, and related documents must render the persisted corporate commercial data consistently: a valid document date, customer GSTIN and per-line HSN before issuance, approved HSN/tax classification, correct reseller party labels, Bill To/Ship To, and canonical totals/payment state. Corporate documents must not use consumer marketplace-facilitator wording.

## Evidence reviewed

- Linear REN-180 description and updates (including the 2026-09-01 reconciliation pass).
- `src/app/api/corporate-proforma-invoices/[id]/download/route.tsx`: payload currently writes `date` while the template requires `documentDate`; it also sets `facilitatedBy` and derives customization GST with a hard-coded 18% fallback.
- `src/components/pdf/corporate-commercial-document-template.tsx`: reads `data.documentDate`, safely formats dates, and renders `facilitatedBy` when present.
- `src/app/api/corporate-orders/[id]/commission-invoice.pdf/route.tsx`: mints `COM/...` inline and uses a commission-service description; it must use the shared corporate numbering authority and reseller-consistent declaration copy.
- `src/components/pdf/corporate-order-summary-template.tsx`: renders raw order advance/balance fields rather than the canonical commercial/payment snapshot.
- `src/lib/services/corporate-documents.ts`, corporate schemas/validations, and manual quote UI: document dates, GSTIN/HSN fields, and issuance paths are nullable or separately derived in some routes.

## Design

1. Correct the PI payload/template contract (`documentDate`) and centralize a safe date formatter so malformed persisted dates never print `Invalid Date`.
2. Gate real PI/tax-invoice issuance when customer GSTIN or any item HSN is absent; presence is required, but GSTIN format validation remains out of scope for this issue.
3. Read GST rate and per-line HSN from the approved HSN/tax-classification source and the REN-177/REN-179 snapshot; never use an invoice-total or silent generic apparel default.
4. Render corporate parties explicitly as Seller/Renivet, Brand fulfillment partner/Greysome, and Corporate customer/Mili AI. Remove `facilitatedBy` from corporate document payloads and verify consumer invoice mediator language is not imported.
5. Render Bill To and Ship To from the customer/order addresses. When no shipping fee is charged, omit shipping and shipping-GST rows; do not print fabricated zero lines.
6. Route commission-invoice numbering through `nextCorporateDocumentNumber` and reconcile declaration/notes text with the reseller model.
7. Make order-summary advance/balance display read from or reconcile against the canonical commercial/payment snapshot used by PI, FO, invoice, and settlement.

## Explicit exclusions

- Composite-supply tax classification remains a Finance/CA decision; this task consumes the approved classification.
- Warehouse-mode inbound GRN controls remain REN-183.
- REN-186 owns the registration-address versus operational-address model.
- No visual redesign or historical destructive backfill is implied.

## Decisions / assumptions

- The exact `documentDate` key mismatch is an `AUTO_DECIDE` defect fix.
- “Required GSTIN/HSN” means non-empty persisted values at issuance; no GSTIN checksum/format validator is introduced.
- Existing issued documents are immutable; invalid legacy records are repaired on regeneration only when source data is available, otherwise regeneration is blocked with an actionable error.
- The canonical commercial snapshot/payment state from REN-177 is the source of truth; if unavailable, issuance/display must fail closed rather than recalculate silently.

## Acceptance examples

For the controlled Mili AI order: Seller Renivet (GSTIN `10AANCR5687A1ZG`), fulfillment partner Family of Grey/Greysome (GSTIN `33BCEPJ5961L1ZD`), customer Mili.ai Technologies (GSTIN `29AASCM3828R1ZB`), lines `30 × ₹400 = ₹12,000` and `Customization 1 = ₹2,000`, composite taxable value ₹14,000, approved GST, explicit Bill To/Ship To, no `Invalid Date`, no `Facilitated by`, no fake shipping-zero line, and totals equal the snapshot.
