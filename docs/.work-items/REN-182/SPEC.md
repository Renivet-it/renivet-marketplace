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

## Proposed design, pending financial-policy confirmation

1. Introduce an explicit `held` state for a materially discrepant invoice,
   separate from `validated` and `rejected`.
2. On structured invoice submission, run all material checks and persist the
   invoice with all failed checks in `held`; it is never treated as validated
   merely because it exists.
3. A reviewer override is a distinct, attributed state transition. It requires
   an explicit reason and retains the original validation issues, reviewer, and
   timestamp. A normal review cannot overwrite validation to `validated`.
4. Any downstream path that uses a brand invoice for financial reporting or
   settlement must select only `validated` or explicitly overridden invoices.
   Existing settlement does not yet use this invoice, so no settlement-value
   source is changed by this task.
5. FO comparison must use the selected FO belonging to the same order and
   brand. Required comparison fields must be made available in the structured
   invoice input and persisted/audited; the uploaded PDF remains an attachment
   and is not parsed.
6. Historical invoices remain readable. They are not silently upgraded to
   validated; migration/rollout needs a defined legacy policy.

## Required validation set

- supplier GSTIN matches the assigned brand record;
- recipient GSTIN matches Renivet's configured GSTIN;
- HSN matches the approved order product classification;
- FO reference identifies the selected FO for this order and brand;
- quantity and unit rate match the FO;
- taxable value and GST components match the agreed FO values;
- taxable value + CGST + SGST + IGST equals invoice total exactly;
- invoice total matches the FO total exactly.

## Decisions requiring Ayan/Finance confirmation

1. **Disposition:** retain a discrepant invoice as `held` for audit and
   correction, or reject it outright without storing a financial invoice row?
   Recommendation: retain it as `held`; it preserves the uploaded evidence
   without allowing financial use.
2. **Override authority:** does existing `MANAGE_ORDERS` suffice, or must the
   override be limited to a Finance/CA role/permission? Recommendation: a
   dedicated finance-review permission or a named Finance/CA role.
3. **Override scope:** may an override authorize settlement/reporting use, or
   may it only close the operational review while the invoice stays excluded?
   Recommendation: allow financial use only after an attributed Finance/CA
   override with a mandatory reason.
4. **Brand uploads:** without OCR, must the brand enter all invoice fields in a
   structured form for validation, or should such uploads be held as
   `unverified` until an admin enters/reviews the fields? Recommendation: hold
   uploads as unverified and require admin structured capture; do not fabricate
   invoice data from the FO.
5. **Rollout:** should validation enforcement apply immediately to all brands,
   or be behind a short-lived feature flag with an Ops announcement? The Linear
   issue requires that the change is not shipped silently.

## Out of scope

- OCR/extraction or visual validation of uploaded files.
- Changing the corporate customer invoice, settlement formula, or statutory tax
  policy.
- Rewriting historical invoice values.
