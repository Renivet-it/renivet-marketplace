# REN-178 — Corporate customization/extras persistence model

## Outcome

Replace the single scalar customization amount and dropped Fulfillment Order extras field with a first-class `Product → Customizations[]` model. Every entered customization must persist unchanged from quote through proforma invoice, corporate order, Fulfillment Order, customer invoice, and settlement/document outputs.

## Scope

Reuse/extend the existing `corporateCustomizations` table and corporate commercial snapshot. Each record needs a stable parent product/order-line reference, name/type, description, amount, quantity or pricing basis, production instruction, artwork/reference metadata, tax-treatment metadata (without deciding the tax rate), and display order. Existing non-zero `customizationPaise` values need a migration representation so historical orders remain readable.

The Fulfillment Order form, mutation schema, service, snapshots, PDF templates, and settlement/document readers must share the same persisted records. Displaying customization rows separately must not imply a separate GST treatment.

## Decisions and open questions

- DEC-001 (HUMAN_CONFIRMATION): Finance/CA decides composite versus distinct tax treatment; this task stores the treatment metadata but does not choose a rate.
- DEC-002 (HUMAN_CONFIRMATION): Existing scalar customization amounts must be migrated as a synthetic customization row with an explicit legacy marker, or an alternative approved compatibility policy must be chosen.
- DEC-003 (RECOMMEND_CONTINUE): Use an order-level customization parent when no product line ID exists, while preserving product/line identifiers when supplied.

## Verification intent

Test at least two distinct customizations on one product line through Quote → PI → Order → FO → Customer Invoice, assert exact field equality and no silent drops, and add a regression test for the FO Packaging/Extras field.
