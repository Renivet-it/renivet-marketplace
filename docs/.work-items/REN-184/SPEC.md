# REN-184 — Use actual place of supply for corporate GST splits

## Outcome

Corporate goods tax splits must use the actual place of supply, primarily the state where delivery/movement terminates, rather than assuming that a GSTIN’s first two digits are the delivery state. Billing address, registered GST address, and delivery/ship-to address must remain distinct and the selected place-of-supply source must be persisted or deterministically derived for each document leg.

## Repository evidence

- `src/app/api/corporate-orders/[id]/commission-invoice.pdf/route.tsx` currently compares `settings.gstin.slice(0, 2)` and `brandConfidential.gstin.slice(0, 2)` to choose CGST/SGST versus IGST.
- The customer invoice route already derives a display `placeOfSupply`, but currently prefers profile billing state and otherwise uses a city/address heuristic (`invoice.pdf/route.tsx:227-243`), so it is not an explicit persisted delivery-state authority.
- Corporate order validation and delivery-address helpers accept `deliveryState`, and several snapshots carry it, but `corporateOrders` itself has `deliveryCity`, `deliveryPincode`, and `deliveryAddress` without a dedicated `deliveryState` column.
- Renivet/brand registration GSTINs and corporate customer GSTINs are stored separately from billing and delivery addresses. The Mili pilot is Karnataka for both billing and delivery, while the Greysome→Renivet and Renivet→Mili legs have different registration states.

## Approved design

1. Add an explicit normalized `deliveryState`/ship-to state to the corporate order snapshot (add a nullable order column if required by the current schema). Capture it from the entered delivery address and preserve it when the order/FO/document is issued; never infer it from GSTIN prefixes.
2. Define a shared place-of-supply resolver for goods that takes the leg’s actual movement/delivery destination and returns a normalized state code/name plus source (`delivery_address`, `registered_address`, or `billing_address`). For goods movement, delivery/ship-to state is authoritative when present; when missing, use the approved billing/registered fallback and persist the source instead of blocking or guessing from a GSTIN prefix.
3. Replace every GSTIN-prefix-only tax split call site, including commission/customer/vendor document routes found by audit. Each leg must pass its own supplier registration, recipient registration, and place-of-supply context; values must not be inherited from another leg.
4. Apply the resulting state comparison consistently: for an intra-state leg, split GST into CGST/SGST; for an inter-state leg, use IGST only. Preserve exact paise totals and existing rounded GST amounts.
5. Persist the resolved place-of-supply state/source in the relevant immutable commercial/document snapshot so a later address edit cannot change an issued document. Render Bill To, Ship To, registered addresses, and Place of Supply as distinct fields where the template supports them.
6. Keep `customerShippingCharge` classification independent. Do not invent shipping tax lines when shipping is `NOT_CHARGED`; separately charged freight remains subject to Finance/CA classification.

## Leg-specific rules

- Brand → Renivet supplier goods leg: use the warehouse/delivery destination recorded on the FO/receipt, not the brand’s GSTIN prefix alone.
- Renivet → corporate customer goods leg: use the customer ship-to/delivery state; billing and GST registration state remain separate display/reference data.
- Renivet commission/service invoice: compare Renivet’s registered GST state with the brand’s registered GST state; do not inherit the customer goods-delivery state.

## Required validation and failure handling

- Normalize state names/codes through one mapping; reject unknown or conflicting values.
- Missing delivery state must not block document generation: use the approved billing/registered fallback and visibly record that fallback source. Never silently default to a hard-coded state or GSTIN prefix.
- Address updates after issuance must not mutate prior snapshots or recompute already-issued documents.
- All tax components must reconcile exactly to the stored GST amount and total.

## Out of scope

General multi-address modeling for services, automated geocoding, legal advice, and changing statutory tax rates. This task only replaces the incorrect state-source heuristic and preserves the existing GST rate source.

## Test expectations

- Customer GSTIN registered in one state with delivery in another produces IGST only for the goods leg.
- Same-state registration and delivery preserves CGST/SGST behavior.
- Brand→Renivet and Renivet→customer legs calculate independently with their own place-of-supply contexts.
- Missing/ambiguous state fails closed or follows only an explicitly approved fallback and records the source.
- Every GSTIN-prefix-only call site is removed or converted to the shared resolver; issued snapshots remain stable after address edits.
