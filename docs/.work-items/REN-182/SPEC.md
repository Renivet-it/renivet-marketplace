# REN-182 — Brand tax-invoice validation must enforce material discrepancies

## Outcome

A supplier/brand tax invoice with a material mismatch must not become an
accepted financial input. The system must validate the invoice against the
selected Fulfillment Order (FO), retain every failed check, and stop
settlement/reporting consumers from using it until an authorized reviewer has
recorded an override reason.

## Repository evidence

- `recordBrandTaxInvoice` currently records mismatches with
  `validationStatus: "pending"`; a clean invoice is immediately `validated`
  (`src/lib/services/corporate-documents.ts:481-577`).
- The existing checks cover supplier GSTIN, recipient GSTIN, product HSN, PO
  total, and arithmetic only. Quantity, unit rate, taxable value, GST amount,
  and a specific FO reference are not represented by the stored invoice input.
- `reviewBrandTaxInvoice` can set any invoice to `validated` without rerunning
  validation, attribution, override reason, or an authorization distinction
  (`src/lib/services/corporate-documents.ts:580-592`).
- `corporateBrandTaxInvoices` only has `pending`, `validated`, and `rejected`
  status plus free-form review notes; it has no hold/override/audit fields
  (`src/lib/db/schema/corporate-platform.ts:967-1022`).
- Brand uploads currently submit only date and file. The server fabricates the
  invoice number and copies FO/brand values into a purported invoice
  (`src/lib/services/corporate-platform.ts:5078-5169`), so it cannot detect a
  mismatch in the uploaded document's real values without OCR/extraction or
  structured brand-entered fields. OCR is explicitly out of scope.
- Settlement issuance currently does not read a brand tax invoice at all; it
  uses the customer tax invoice/order snapshot (`src/lib/services/corporate-documents.ts:664-835`).
- The management route is protected by `MANAGE_ORDERS`; the brand-assigned
  upload requires brand membership (`src/lib/trpc/routes/general/corporate-platform.ts:374-401`).

## Approved design

1. Brand members and order admins may upload the invoice file. A brand-file
   upload creates a separate `brand_tax_invoice_upload` record in
   `pending_review`; it does not create a tax-invoice record or invent facts
   from the FO. The upload record contains only file metadata, order, brand,
   selected FO, submitter, and a unique file key.
2. Admin submits/captures the invoice's structured facts and the system runs
   every check. A clean invoice is `accepted`; a mismatch is `held` with every
   failed check retained.
3. An order admin with existing `MANAGE_ORDERS` permission may accept or reject
   a held invoice. Acceptance of a held mismatch requires a non-empty reason,
   actor, and timestamp; it is the explicit approval for financial use.
4. Upload states are `pending_review`, `captured`, and `superseded`. Captured
   invoice states are `held`, `accepted`, `rejected`, and `superseded`. Only
   captured `accepted` invoices meet the trusted financial predicate.
   A corrected re-upload creates a new review candidate but does not supersede
   the currently accepted financial invoice. The predecessor becomes
   `superseded` atomically only when the replacement is accepted. A held or
   rejected replacement therefore cannot revoke an accepted invoice.
   Informational views may show all records; financial consumers use only the
   current accepted record.
5. The FO will persist its expected quantity, unit rate, taxable value, CGST,
   SGST, IGST, total, FO number, normalized supplier GSTIN, normalized Renivet
   GSTIN, and approved normalized HSN as an immutable effective-at-issuance
   snapshot. Validation never rereads mutable brand, settings, or product rows. The
   structured supplier invoice persists the supplier-asserted FO reference and
   compares normalized references exactly. The authoritative FO snapshot comes
   from the issued FO input: taxable value is `unitBuyPricePaise * quantity` and
   GST is rounded once with `Math.round(taxableValuePaise * gstRateBps / 10000)`.
   Matching supplier/recipient GSTIN state codes split that GST into CGST and
   SGST (`CGST = floor(total GST / 2)`, `SGST = remainder`); different state
   codes use IGST only. Invoice values must match every persisted component
   exactly in paise; CGST/SGST and IGST are not interchangeable.
6. Upload submission uses a deterministic `(order_id, file_key)` key;
   it is the uploaded file key plus order ID. A database unique constraint on
   `(order_id, file_key)` makes repeat requests return the same pending upload.
   Admin may correct structured facts while the upload is pending without
   creating another invoice candidate. Once held, accepted, or rejected, a
   correction requires a new file upload/candidate. A locked acceptance
   transaction supersedes the prior accepted invoice only after validating the
   replacement and uses partial unique database indexes to leave at most one
   pending upload in the upload table, one held captured invoice in the invoice
   table, and one current accepted invoice per FO. Admin capture atomically
   marks the upload `captured` and inserts its held/accepted invoice. One
   accepted invoice may coexist with one pending upload or held replacement.
   A transition version prevents a review from accepting a superseded row. A failed DB transaction leaves no trusted
   invoice record; the already-uploaded file can be retried with the same key.
7. Existing invoice records remain readable. Per FO, migration orders legacy
   rows deterministically by creation time and id, maps the newest non-rejected
   row to `held`, maps older duplicates to `superseded`, and preserves
   `rejected`. No legacy row is placed in the upload table or becomes accepted
   without fresh review against a reliable snapshot. New
   acceptance on a legacy FO
   without a reliable tax snapshot is blocked until the FO is reissued with a
   snapshot; no historical row is newly promoted by this migration. Enforcement
   is enabled on release, with an Operations release note.

## Consumer contract

- `getOrderDocumentChain`, the corporate dashboard, brand workspace, and the
  document download route are informational consumers: they may show an active
  invoice and must display its state.
- Financial consumers must use `activeAcceptedBrandTaxInvoice`: the active
  non-superseded record with status `accepted` for the same order, brand, and
  FO. The current settlement does not consume brand invoices.
- The review mutation passes the admin actor ID to the service. The service
  verifies invoice/order/brand/FO ownership before changing state, persists
  actor/time/reason, and rejects held-invoice acceptance without a reason.

## Race and recovery coverage

Tests must prove same-key retry returns the original pending upload; simultaneous
corrected uploads leave one active captured invoice; a review cannot accept a row
superseded by a correction; and a retry after a file upload but failed database
write recovers the candidate without trusting duplicate records.

## Required validation set

- supplier GSTIN matches the assigned brand record;
- recipient GSTIN matches Renivet's configured GSTIN;
- HSN matches the approved order product classification;
- FO reference identifies the selected FO for this order and brand;
- quantity and unit rate match the FO;
- taxable value and GST components match the agreed FO values;
- taxable value + CGST + SGST + IGST equals invoice total exactly;
- invoice total matches the FO total exactly.

## Operational note

The release must include an Operations note that supplier tax-invoice uploads
now require admin acceptance before financial use.

## Out of scope

- OCR/extraction or visual validation of uploaded files.
- Changing the corporate customer invoice, settlement formula, or statutory tax
  policy.
- Rewriting historical invoice values.
