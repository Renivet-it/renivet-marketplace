# REN-178 Specification

## Goal

Replace the single scalar corporate customization amount with an extensible `Product -> Customizations[]` model and carry every customization entered by an admin or customer unchanged through Quote, Proforma Invoice, Corporate Order, Fulfillment Order, Customer Invoice, and settlement/document records. A value shown in the UI must never be silently dropped.

## Linear context

- Title: [Corporate Order] Customization/extras entered by admin are silently dropped — build extensible Customization model
- Priority: Urgent
- Status: Backlog
- Label: Bug
- Assignee: Ayan Ganguly
- Branch: `ayanganguly333/ren-178-corporate-order-customizationextras-entered-by-admin-are`
- Relations: REN-177 (commercial snapshot), REN-180 (document integrity)

## Evidence and current behavior

The schema contains a minimal `corporateCustomizations` table with `quoteId`, `orderId`, `customizationType`, `costPaise`, `status`, and free-form metadata, but no structured name/description/basis/instruction/artwork/display-order contract and no observed relations/query propagation. Orders still store only scalar `customizationPaise`; quotes store `customizationCostPaise` plus manual extra fields.

The admin Fulfillment Order panel displays “Packaging / Extras charges” in its total preview, but `corporateVendorPurchaseOrderInputSchema` and `issueFulfillmentOrder` do not accept or persist it. Manual quote UI similarly collapses extras into one amount/description. PI, FO, invoice, order summary, and settlement readers use aggregate/scalar values or derive their own display. This creates silent data loss and document divergence.

## Requirements

1. Define an extensible customization record under the authoritative REN-177 commercial snapshot with stable id/order, parent product/order line, name, description, amount, quantity/basis, production instruction, artwork/reference, display order, and tax-treatment metadata.
2. Accept and persist multiple distinct customizations from manual quote and Fulfillment Order entry; validate amounts, quantities, text lengths, references, and uploads using existing corporate upload controls.
3. Propagate the same customization records (including zero/flat/per-unit basis and references) through Quote → PI → Order → FO → Customer Invoice → settlement/document records without silent omission or re-derivation.
4. Keep the existing scalar fields as a documented backward-compatible aggregate during migration, but make new snapshots/customization lists authoritative and reconciled with aggregate totals.
5. Render customizations as separate commercial lines where appropriate for transparency. Visual separation must not imply a separate GST treatment; tax classification remains the approved Finance/CA decision consumed by REN-179/180.
6. Fix the FO UI/schema/mutation drift so the Packaging/Extras value is persisted before the UI reports success and appears in the issued FO.
7. Preserve authorization, tenant/order scoping, idempotent document issuance, and atomic writes across all affected paths.
8. Migrate existing non-zero scalar customization amounts into a clearly marked legacy row without inventing product/tax facts or changing historical totals.

## Scenarios

- SCN-001: A quote with two customizations (for example logo printing and sleeve print) stores both distinct records and their display order.
- SCN-002: A manual quote with name, description, amount, basis, instruction, and artwork reference persists every field or returns a validation error before success.
- SCN-003: The customer-facing quote/PI shows the same customization list and amounts as the saved snapshot.
- SCN-004: Quote acceptance creates an order whose customization records and aggregate total reconcile exactly.
- SCN-005: The FO form submits Packaging/Extras, the mutation persists it, and the issued FO renders it.
- SCN-006: Customer tax invoice and settlement/document outputs render the snapshot customizations without local fallback or silent omission.
- SCN-007: A customization artwork/reference upload with invalid type/size/URL is rejected and no partial record remains.
- SCN-008: Retried/concurrent quote, order, or FO issuance is idempotent and does not duplicate customization rows or documents.
- SCN-009: An unauthorized actor cannot add/read customizations on another order.
- SCN-010: An existing order with only scalar customizationPaise gets one marked legacy customization row and remains numerically unchanged.
- SCN-011: A Finance/CA tax-treatment update changes interpretation through the authoritative snapshot/master without changing the customization persistence model.

## Invariants

- INV-001: Every accepted customization is represented exactly once per parent snapshot/version with stable identity and display order.
- INV-002: Sum of customization line amounts/bases equals the snapshot customization aggregate under the documented rounding policy.
- INV-003: Downstream documents consume the authoritative snapshot and do not reconstruct or silently discard customization data.
- INV-004: UI success is returned only after customization data and parent document writes commit atomically.
- INV-005: Artwork/reference values are validated and remain scoped to the corporate order.
- INV-006: Existing scalar totals remain backward-compatible and legacy rows are explicitly labeled.
- INV-007: Display separation never hard-codes or implies tax classification.
- INV-008: Corporate authorization and tenant boundaries apply to customization mutations and reads.

## Architecture and flows

- FLOW-001: Entry form -> validated customization array -> quote revision and commercial snapshot.
- FLOW-002: Approved quote -> order snapshot/materialized customization rows -> PI and FO readers.
- FLOW-003: Snapshot -> customer invoice/settlement/order summary renderers, all using one list and aggregate reconciliation.
- FLOW-004: Legacy scalar backfill -> marked legacy customization row, preserving historical aggregate values.

## Dependencies and decisions

- DEP-001: REN-177 canonical commercial snapshot field/version contract.
- DEP-002: Existing `corporateCustomizations` table and additive migration strategy.
- DEP-003: Existing artwork/file upload validation and corporate document authorization.
- DEP-004: REN-180/REN-179 document and tax consumers.

DEC-001 is `HUMAN_CONFIRMATION` and remains deferred: Finance/CA decides composite-vs-distinct supply and the applicable rate for customization/printing. This task stores tax-treatment metadata and renders separate commercial lines, but must not hard-code a separate 18% rate or fold/omit tax without the approved authority.

## Security, compatibility, and exclusions

Reuse `MANAGE_ORDERS` for admin mutations and existing corporate customer/order scoping. Validate artwork/reference URLs and file metadata with existing controls. Out of scope: deciding GST/legal treatment, new upload infrastructure, non-corporate customizations, and redesigning the entire catalog customization UI. Additive migration/backfill must never invent missing details.

## Verification expectations

Required: Bun unit/schema tests for customization validation and aggregate reconciliation; API/service tests for manual quote and FO persistence; integration/E2E coverage for two or more customizations through every downstream document; upload/security and idempotency tests; legacy backfill regression; visual document checks; full Bun and governance validation.
