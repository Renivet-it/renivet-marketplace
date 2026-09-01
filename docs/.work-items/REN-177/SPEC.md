# REN-177 Specification

## Goal

Make one immutable corporate commercial/production snapshot the source of truth for the Fulfillment Order and every related corporate document. The snapshot must contain everything a factory and downstream finance process need: identity/GST, addresses, product/HSN, quantity and sizes, colors, artwork, print method, customizations, pricing/tax, payment position, delivery mode/address, QC requirements, and fulfillment details.

## Linear context

- Title: [Corporate Order] Fulfillment Order must be the single authoritative production source (size/artwork/color/QC/GST missing)
- Priority: High
- Status: Backlog
- Label: Bug
- Assignee: Ayan Ganguly
- Branch: `ayanganguly333/ren-177-corporate-order-fulfillment-order-must-be-the-single`
- Relations: REN-178, REN-179, REN-180, REN-183

## Evidence and current behavior

`corporateVendorPurchaseOrders` stores only aggregate quantity, buy price, total, delivery fields, payment terms, and instructions. It has no size breakdown, artwork, colors, SKU/HSN, print method, QC criteria, or customization list. `issueFulfillmentOrder` computes `totalAmountPaise = unitBuyPricePaise * order.quantity`, excluding GST, customization, and extras. The admin FO panel previews Packaging/Extras but does not include it in the mutation payload. The vendor-PO PDF recomputes totals and product data from order/quote state instead of reading the persisted FO row, so the database and PDF can disagree.

The order already contains many required values (`sizeBreakdown`, `employeeRows`, artwork, product and pricing snapshots), but they are not attached to the FO. Existing downstream templates independently reconstruct product, tax, and customization details. This issue must establish the snapshot contract and make FO issuance persist it; REN-178 supplies the structured customization list and REN-179/180 supply authoritative tax/document rules.

## Requirements

1. Define a versioned immutable `corporateCommercialSnapshot` containing customer/seller identity, GST identifiers, billing/ship-to addresses, product/SKU/HSN, quantity, size breakdown, colors, artwork/reference, logo placement, print method, customizations, taxable values, tax-treatment metadata, payment position, delivery mode/address/responsibility, expected delivery, payment terms, QC requirements, and source order/quote IDs.
2. Build the snapshot once at the authoritative order/FO issuance boundary, persist it atomically with the Fulfillment Order, and prevent post-issuance edits from changing the rendered document.
3. Make the FO PDF and all related corporate readers consume the stored snapshot and stored commercial totals; they must not recompute from quote/order tables or apply local defaults.
4. Include GST and all approved customization/extras amounts in the stored commercial total, with line-level reconciliation and explicit tax/shipping classifications. Do not invent GST or freight treatment while Finance/CA decisions are pending.
5. Persist and render direct-delivery versus warehouse-delivery responsibility explicitly. Direct mode names the customer ship-to; warehouse mode names Renivet warehouse and states Renivet onward-dispatch responsibility. The order-creation shipping dropdown offers `NOT_CHARGED` (default), `INCLUDED_IN_SUPPLY`, and `SEPARATELY_CHARGED`; the selected value is stored and rendered without inventing a freight line.
6. Carry the full customization list from REN-178 and all FO form fields, including Packaging/Extras, so UI success is impossible when a value is dropped.
7. Preserve existing authorization, delivery-mode controls, QC/dispatch gates, idempotency, and legacy FO readability through an additive migration/backfill policy.

## Scenarios

- SCN-001: Issuing an FO creates a complete versioned snapshot with all production and commercial fields.
- SCN-002: Size breakdown, colors, artwork, logo placement, print method, QC requirements, SKU/HSN, and customizations appear identically in FO storage and PDF.
- SCN-003: Stored FO total includes GST, approved customizations/extras, and approved shipping classification and reconciles to line totals.
- SCN-004: Direct delivery renders customer ship-to and responsibility; warehouse mode renders Renivet warehouse and onward-dispatch responsibility without fake freight.
- SCN-005: Packaging/Extras entered in the admin form is persisted and rendered, or the mutation fails visibly.
- SCN-006: PI, customer invoice, order summary, settlement, and FO readers use the same snapshot and cannot diverge through local recomputation.
- SCN-007: Missing required snapshot data or unresolved authority blocks issuance with a clear error and no partial FO.
- SCN-008: Retried/concurrent issuance is idempotent and cannot create conflicting snapshots or duplicate issued FOs.
- SCN-009: Unauthorized actors cannot create/read/alter another order's FO snapshot.
- SCN-010: Existing FOs remain readable; derivable legacy data is backfilled with provenance and non-derivable fields remain explicitly unavailable.
- SCN-011: Future approved HSN/tax/customization/shipping master changes affect new snapshots only; existing snapshots remain immutable.

## Invariants

- INV-001: One immutable versioned commercial snapshot is authoritative for each issued FO and its downstream documents.
- INV-002: Persisted FO totals and rendered PDF totals are identical and line-reconciled.
- INV-003: No document reader recomputes or silently defaults snapshot fields.
- INV-004: Every UI-entered production/commercial value is persisted or issuance fails.
- INV-005: Delivery mode and responsibility are explicit and no unapproved freight is added.
- INV-006: Snapshot writes and FO issuance are atomic and idempotent.
- INV-007: Snapshot data is order-scoped and protected by existing corporate authorization.
- INV-008: Legacy backfill never invents tax, HSN, freight, or production facts.
- INV-009: Snapshot tax-treatment metadata is data-driven and does not decide unresolved Finance/CA policy.

## Architecture and flows

- FLOW-001: Approved order + FO input -> validated source records -> canonical snapshot builder -> atomic FO/snapshot persistence.
- FLOW-002: Canonical snapshot -> FO PDF, PI, customer invoice, order summary, settlement, and exports.
- FLOW-003: Direct/warehouse delivery selection -> explicit ship-to/responsibility and approved shipping classification.
- FLOW-004: Legacy FO/order data -> provenance-marked compatibility snapshot without fabricated values.

## Dependencies and decisions

- DEP-001: REN-178 structured customization model and propagation contract.
- DEP-002: REN-179 authoritative HSN/GST classification enforcement.
- DEP-003: REN-180 document date/GSTIN/HSN rendering contract.
- DEP-004: REN-183 warehouse-mode GRN and `customerShippingCharge` classification.

DEC-001 is partially resolved: shipping classification has three selectable values with `NOT_CHARGED` as the default, confirmed by the owner. Finance/CA must still approve customization tax treatment and HSN/rate. REN-177 stores explicit metadata and blocks unapproved issuance; it must not choose a legal/financial rule.

## Security, compatibility, and exclusions

Reuse `MANAGE_ORDERS`, existing order/tenant scoping, and upload validation. Additive schema/migration only; no destructive rewrite of issued FOs. Out of scope: multi-vendor FOs, new PDF visual redesign beyond required fields, warehouse GRN implementation itself, and Finance/CA legal decisions.

## Verification expectations

Required: unit tests for snapshot building/reconciliation and delivery responsibility; API/integration tests for atomic/idempotent FO issuance and all fields; E2E test with sizes/artwork/colors/customizations/extras/GST; PDF equality checks against stored snapshot; authorization/upload tests; legacy backfill regression; full Bun and governance validation.
