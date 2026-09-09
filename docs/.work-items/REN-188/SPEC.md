# REN-188 — Add operational sections to the Brand Fulfillment Order

## Summary

Improve the Brand Fulfillment Order PDF so a supplier brand can act on one
document. The PDF will clearly identify the supplier, corporate customer,
delivery destination, production/customization instructions, QC status, and
delivery/shipment details using data already stored for the order. This is a
presentation-only change: tax values and business state are not recalculated or
mutated.

## Scope

In scope:

- Extend the Brand Fulfillment Order route and document template with clear
  operational sections.
- Add a **FULFILLED BY** supplier-brand block.
- Add explicit **CORPORATE CUSTOMER** and **DELIVER TO** blocks.
- Render stored product configuration, customization, production, size, QC,
  and delivery/shipment information in actionable labels.
- Keep unavailable optional values blank or explicitly marked unavailable; do
  not invent dates, statuses, addresses, or instructions.
- Preserve the existing authorization checks, financial snapshot values, PDF
  endpoint, and document numbering.

Out of scope:

- Tax determination, GST/HSN calculation, totals, pricing, or invoice logic.
- Database schema or migration changes.
- Changing order, shipment, QC, customization, or vendor-PO state.
- Changing permissions or exposing the PDF to a new audience.
- Changing unrelated commercial documents or dashboard UI.

## Requirements

| ID | Requirement |
| --- | --- |
| REQ-188-001 | The PDF identifies the supplier brand in a clearly labelled FULFILLED BY block using the stored brand identity/address/contact data. |
| REQ-188-002 | The PDF identifies the corporate customer in a clearly labelled CORPORATE CUSTOMER block using stored company, contact, GSTIN, and order identity data. |
| REQ-188-003 | The PDF identifies the destination in a clearly labelled DELIVER TO block using the stored fulfillment delivery mode and address. |
| REQ-188-004 | The PDF presents stored product configuration, customization, production instructions, size breakdown, and quantity without changing their values. |
| REQ-188-005 | The PDF presents actionable QC information from the latest stored QC submission, including status and available remarks/review information, without creating or inferring a QC decision. |
| REQ-188-006 | The PDF presents stored delivery and shipment information, including expected delivery, courier/tracking identifiers, status, and instructions when available. |
| REQ-188-007 | Missing optional values remain blank or use a consistent unavailable marker; no fallback date, fabricated status, or generic value may imply unavailable data exists. |
| REQ-188-008 | Existing persisted tax, pricing, totals, document number, endpoint, and authorization behavior remain unchanged. |

## Design decisions

- **DEC-188-001:** Add structured optional operational-section data to the
  existing PDF template rather than encoding all content as generic reference
  rows. This makes labels and blank-value behavior deterministic while keeping
  the existing template reusable.
- **DEC-188-002:** Resolve the latest QC submission and existing shipment in the
  document route using read-only queries. The latest record is selected by the
  existing created-at ordering convention.
- **DEC-188-003:** Use the stored fulfillment-order delivery address and mode as
  the primary supplier instruction, with the order delivery address only where
  the existing route already uses it. No synthetic expected-delivery date is
  allowed.
- **DEC-188-004:** Preserve the current supplier/customer document direction,
  but make the semantic roles explicit through the new section labels. This
  avoids changing who the document is issued to while addressing operational
  ambiguity.
- **DEC-188-005:** QC is actionable through status and stored notes only. The
  PDF may label the next operational implication of a stored status, but may
  not infer approval, rejection, or release beyond the persisted status.

## Behavior matrix

| Condition | Expected behavior |
| --- | --- |
| Complete order, brand, QC, and shipment data | Render every available operational section with stored values. |
| No QC submission | Render the QC section with an unavailable/blank value; do not imply QC approval. |
| No shipment or tracking data | Render delivery instructions/address that exist and leave shipment fields unavailable. |
| No expected delivery date | Leave expected delivery unavailable; do not default to today or a calculated date. |
| No customization or production detail | Leave that detail blank/unavailable while retaining the product and quantity rows. |
| Unauthorized user or unrelated brand member | Preserve the existing 401/403 behavior and do not render a document. |
| Existing tax/pricing snapshot | Render exactly the existing persisted values and totals. |

## Invariants and boundaries

- The endpoint remains protected by authentication and existing site-order or
  brand-membership authorization.
- The PDF is read-only and does not update an order, FO, shipment, QC record,
  customization, inventory, or document number.
- No value in the new sections is a source for tax or financial calculation.
- Stored null/missing data cannot become a fabricated date, status, address, or
  operational instruction.
- The existing `CorporateCommercialDocumentData` financial fields and PDF
  download contract remain compatible.

## Dependencies and integrations

- Corporate order and brand identity records provide customer/supplier data.
- The issued corporate fulfillment order provides the operational delivery,
  pricing snapshot, product configuration, customization snapshot, and size
  data already used by the route.
- The latest corporate QC submission provides stored QC status, remarks, review
  notes, and sample coverage.
- The corporate shipment record provides courier, tracking, AWB, dates, and
  status when present.
- React PDF renders the new display-only sections; no external provider is
  called.

## Verification plan

- Add focused tests for operational-data mapping and unavailable-value rules.
- Add route/template regression coverage proving the new labels and stored
  values are present, with no generated fallback date.
- Verify existing tax/totals and endpoint authorization behavior remain
  unchanged.
- Manually download a complete Brand Fulfillment Order and inspect the supplier,
  customer, delivery, production, QC, and shipment sections.
- Manually download an order with missing QC/shipment/expected-date data and
  confirm no fabricated values appear.
- Run `bun test` and the governance validator.

## Rollback

Revert the REN-188 implementation commit. No data repair or migration rollback
is required because the change only reads and renders existing records.
