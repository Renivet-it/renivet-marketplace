# REN-178 — Corporate customization/extras persistence model

## Outcome

Replace the single scalar customization amount and dropped Fulfillment Order extras field with a first-class `Product → Customizations[]` model. Every entered customization must persist unchanged from quote through proforma invoice, corporate order, Fulfillment Order, customer invoice, and settlement/document outputs.

## Scope

Reuse/extend the existing `corporateCustomizations` table and corporate commercial snapshot. Each record needs a stable parent product/order-line reference, name/type, description, amount, quantity or pricing basis, production instruction, artwork/reference metadata, tax-treatment metadata (without deciding the tax rate), and display order. Existing non-zero `customizationPaise` values need a migration representation so historical orders remain readable.

The Fulfillment Order form, mutation schema, service, snapshots, PDF templates, and settlement/document readers must share the same persisted records. Displaying customization rows separately must not imply a separate GST treatment.

## Decisions and open questions

- DEC-001 (RESOLVED): If a customization is part of the main product supply, it uses the parent product tax treatment. If it is separate, it uses its own approved HSN/GST classification. FO, PI, and invoice display the same result.
- DEC-002 (RESOLVED): Existing scalar customization amounts become one synthetic `Legacy Customization` row with an explicit legacy marker.
- DEC-003 (RESOLVED): REN-178 keeps one product per corporate order and supports multiple customization rows beneath that product; multi-product order lines are out of scope.

## Canonical design

The existing customization table is expanded with structured fields and a stable display order. The order-level commercial snapshot stores the ordered customization list and its version. Quote revisions capture their own immutable customization list. FO, PI, customer invoice, settlement, replacement, and related document readers consume that snapshot rather than re-deriving amounts from UI fields or mutable rows. At quote creation, the admin selects whether each customization is included in the parent product supply or is a separate supply. Included customizations use the parent classification; separate customizations require an approved HSN/SAC master classification, and its GST rate is persisted in the snapshot.

All parent-plus-customization writes use one database transaction with idempotent retry behavior. The legacy backfill is bounded and idempotent, reports reconciliation counts, and preserves old scalar columns until the read/write cutover is verified.

## Verification intent

Test at least two distinct customizations on one product line through Quote → PI → Order → FO → Customer Invoice, assert exact field equality and no silent drops, and add a regression test for the FO Packaging/Extras field.
