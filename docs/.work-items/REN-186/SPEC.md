# REN-186 — Corporate document identity address separation

## Outcome

Allow corporate document settings to represent the GST registration address
separately from an operational/office address, while keeping the existing
address values as the registration address for backwards compatibility.
Corporate GST identity output must use the registration address and configured
GSTIN; it must never fall back to a fabricated GSTIN or unrelated Kolkata
address.

## Confirmed facts

- Finance/user confirmation on 2026-09-10 identifies the registered office as
  `Flat No E2001, Kolte Patil Itowers, Electronics City, Bangalore South,
  Karnataka, 560100, India`.
- GSTIN `10AANCR5687A1ZG` is confirmed for that registered office.
- This task must not write those values into production data automatically.

## Current implementation evidence

- `corporate_document_settings` has one address block (`address_line_1` through
  `country`) used by the settings panel, service helpers, and corporate PDFs.
- The settings validation/API path accepts only that one address block.
- `commission-invoice.pdf` falls back to `19AAACR1234F1Z5` and Kolkata/West
  Bengal identity values when settings are incomplete.
- `settlement-statement.pdf` also has a Kolkata/West Bengal fallback address
  and fabricated GSTIN.
- Existing document settings rows and callers must remain readable without
  requiring operational-address values.

## Implementation contract (critic amendments incorporated)

1. Treat the existing address columns and UI values as the **GST registration
   address**. Relabel the settings panel accordingly; do not rename or
   reinterpret existing database columns.
2. Add these exact nullable database/API fields: `operationalAddressLine1`,
   `operationalAddressLine2`, `operationalCity`, `operationalState`,
   `operationalPostalCode`, and `operationalCountry`. Expose them through the
   validation schema, tRPC update payload, and settings panel under an
   explicitly labelled **Operational / office address** block.
3. Keep operational fields optional. Existing rows remain valid and no
   migration or application path may copy the confirmed Bangalore address into
   production automatically.
4. Add shared registration/operational formatter helpers with distinct types.
   A partial operational address is treated as absent for fallback purposes;
   saving an empty field explicitly clears it. Operational context may use a
   complete operational address and otherwise falls back to registration.
5. Apply this route matrix:

   | Route | Legal identity address/GSTIN | Operational address | Tax/place-of-supply |
   | --- | --- | --- | --- |
   | Proforma invoice | registration; required guard | none | unchanged |
   | Tax invoice | registration; required guard | none | unchanged |
   | Commission invoice | registration; required guard before number allocation | none | unchanged |
   | Receipt voucher | registration; required guard | none | unchanged |
   | Settlement statement | registration; required guard | none | unchanged |
   | Vendor PO / fulfillment order | registration; required guard | only operational context if explicitly rendered | unchanged |
   | Delivery challan | registration when identity is rendered; no new tax calculation | operational only if explicitly rendered | unchanged |
   | Summary PDF | registration when identity is rendered | operational only if explicitly rendered | unchanged |

   No route may silently use operational fields in a legal identity block.
6. Remove fabricated GSTIN and unrelated address fallbacks from corporate
   documents. Before any document-number allocation or other write side effect,
   routes that render corporate legal identity must validate GSTIN plus
   registration address line 1, city, state, and postal code. Missing/partial
   identity returns the established `PRECONDITION_FAILED`/HTTP 422 contract;
   it does not render a PDF. Do not log raw GSTIN or address values.
7. Existing PDF routes continue to read current settings at generation time;
   this change does not rewrite stored document snapshots or regenerate already
   issued files. Tax/place-of-supply inputs and historical financial records
   remain unchanged.
8. The migration adds the six nullable columns in one forward migration with
   no backfill. Older clients omitting the fields preserve existing values;
   explicit null/empty values clear them. No optimistic-locking or concurrent
   settings-save behavior is introduced in this task; the existing last-write-
   wins update behavior remains documented.

## Requirements

- REQ-001: Admins can view and save distinct registration and operational
  addresses.
- REQ-002: Existing settings rows load and save without operational fields.
- REQ-003: GST/legal identity output consistently uses registration address and
  configured GSTIN.
- REQ-004: No corporate PDF fabricates GSTIN, state, or address identity data
  when settings are incomplete.
- REQ-005: Regression tests cover validation, persistence mapping, helper
  selection, authorization, route output, side-effect ordering, and
  fail-closed behavior.
- REQ-006: Address separation does not change tax/place-of-supply calculations
  or stored historical document/financial data.

## Scenarios

- SCN-001: Existing row with only registration address renders the same
  registration identity and has empty operational fields.
- SCN-002: Admin saves both address blocks and reloads both exact values.
- SCN-003: A GST document with both addresses renders the registration address
  and GSTIN, never the operational address in the legal identity block.
- SCN-004: An incomplete GST identity request is rejected rather than rendered
  with fabricated defaults.
- SCN-005: An operational-context field may use the operational address when
  present, and safely falls back to the registration address when absent.
- SCN-006: Each of the eight corporate PDF routes follows the route matrix and
  never places operational address in legal identity output.
- SCN-007: Partial operational address is treated as absent; explicit clearing
  removes previously saved operational values; omitted legacy fields preserve
  them.
- SCN-008: Commission invoice rejects incomplete identity before allocating a
  document number, and retrying a valid request preserves existing allocation
  semantics.
- SCN-009: Authorization remains required for settings read/update and no raw
  identity values are emitted in failure telemetry.

## Invariants

- INV-001: Existing address columns mean GST registration address throughout
  the corporate document pipeline.
- INV-002: A missing GSTIN is never replaced by a hardcoded GSTIN.
- INV-003: Adding operational fields does not mutate existing settings or
  historical document snapshots.
- INV-004: Registration and operational addresses cannot be silently swapped
  by a shared formatter.
- INV-005: Identity validation precedes document-number allocation and other
  document writes.
- INV-006: Address display separation cannot alter tax/place-of-supply inputs.

## Test expectations

- Unit/schema tests for optional operational fields and address formatting.
- Service/route regression tests for all eight routes proving
  registration-address selection, absence of fabricated values, 422 failure
  behavior, and commission side-effect ordering.
- Authorization tests for settings read/update and migration/schema
  verification that existing rows and legacy payloads remain compatible.
- Run `bun test` and `bun run governance:validate -- docs/.work-items/REN-186/work-item.yaml`.

## Out of scope

- Automatically populating or correcting production GSTIN/address data.
- Finance/CA registration changes, GST filings, historical PDF regeneration,
  tax calculation changes, or changing warehouse/customer delivery addresses.

## Approval

The confirmed registered-office/GSTIN facts and the separation design were
provided by the user on 2026-09-10. Independent critic review and amendments
are recorded in `CRITIC.md`.
