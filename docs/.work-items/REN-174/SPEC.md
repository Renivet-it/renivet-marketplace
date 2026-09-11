# REN-174 Engineering Specification

## Decision and scope

`updateProductStock` has relative-decrement semantics: its `quantity` input is a
delta that is subtracted from the stored stock. Cancellation must therefore pass
the cancelled line quantity as the reversal delta, not `currentStock + quantity`.
The database mutation will additionally floor the resulting stock at zero as
defense-in-depth. Customer cancellation, admin/support cancellation, and any
active equivalent cancellation occurrence must follow the same contract.

## Evidence

- `src/lib/db/queries/product.ts:3497-3565` subtracts each supplied quantity from
  product or variant stock.
- `src/lib/trpc/routes/general/orders.ts:1944-1955` currently passes
  `currentStock + item.quantity` while restoring cancelled stock.
- `src/lib/support/cancel-order-helper.ts:127-138` repeats the same absolute-target
  mistake for admin/support cancellation.
- `src/lib/trpc/routes/general/orders.ts:1297-1300` uses positive item quantities
  during order creation and must remain a decrement path.
- `src/app/api/webhooks/razorpay/payments/route.ts:620-637` is an active order
  creation decrement path; its `stock - quantity` calculation must not be changed
  into cancellation semantics.
- Linear REN-174 and QA DEF-003 confirm the arithmetic contract mismatch and the
  requirement for exact restoration and a non-negative floor.

## Non-goals

No schema or migration change, historical stock reconstruction, order cancellation
policy change, refund-policy change, or payment/webhook redesign is included.

## Requirements

- `REQ-001` (explicit): `updateProductStock` treats `quantity` as a relative
  decrement delta for both products and variants.
- `REQ-002` (explicit): Customer cancellation passes each cancelled item quantity,
  restoring stock to the exact pre-order value when the original decrement was
  applied once.
- `REQ-003` (explicit): Admin/support cancellation uses the identical relative
  restoration contract.
- `REQ-004` (explicit): The stock mutation floors resulting product and variant
  quantities at zero and never persists a negative value through this path.
- `REQ-005` (explicit): Active order-creation decrement paths, including the
  Razorpay webhook, retain their existing decrement behavior.
- `REQ-006` (explicit): Existing cancellation authorization, shipment/refund
  handling, order-state transitions, and error isolation remain unchanged.
- `REQ-007` (inferred): Missing or stale related records do not cause an unrelated
  product/variant row to be updated.

## Scenarios

- `SCN-001`: A customer cancellation restores a product-only item exactly.
- `SCN-002`: A customer cancellation restores a variant item exactly.
- `SCN-003`: Admin/support cancellation restores product and variant items exactly.
- `SCN-004`: A zero or already-low stock value cannot become negative after a
  cancellation or other relative stock update.
- `SCN-005`: Order creation still decrements product and variant stock by the item
  quantity, including the active Razorpay webhook path.
- `SCN-006`: Unauthorized customer cancellation remains rejected and does not
  mutate stock.
- `SCN-007`: Shipment/refund/order-status failure behavior remains unchanged and
  stock mutation errors remain isolated according to the existing boundary.
- `SCN-008`: A missing product or variant match does not update a different row.

## Invariants

- `INV-001`: Every stock update has relative-delta semantics.
- `INV-002`: A successful cancellation reverses the original decrement exactly once.
- `INV-003`: Persisted product and variant stock is never negative after the shared
  mutation.
- `INV-004`: Product and variant identity remain scoped by the existing IDs.
- `INV-005`: Only an authorized cancellation can reach the customer cancellation
  stock-restoration path.
- `INV-006`: Order creation remains a decrement and is not accidentally converted
  into an increment.
- `INV-007`: Stock integrity changes do not alter refund, shipment, or order-status
  transitions.

## Flows

- `FLOW-001`: Authorized cancellation loads the order, completes existing refund
  and shipment handling, sends item quantities as restoration deltas, floors the
  shared mutation result, and updates cancellation state.
- `FLOW-002`: Admin/support cancellation uses the same restoration delta and keeps
  its existing operational error boundary and audit behavior.
- `FLOW-003`: Order creation continues to pass item quantities to the same shared
  decrement mutation, including the Razorpay webhook path.

## Dependencies and boundaries

- `DEP-001`: Existing product/variant query transaction and availability/QC
  reconciliation; resolved and unchanged.
- `DEP-002`: REN-144 order/payment integrity; related coordination only, not a
  blocker for this arithmetic correction.
- `INT-001`: Product stock persistence.
- `INT-002`: Variant stock persistence.
- `INT-003`: Customer cancellation API.
- `INT-004`: Admin/support cancellation helper.
- `INT-005`: Razorpay order-creation webhook.
- `SEC-001`: Protected customer cancellation authorization boundary.
- `SEC-002`: Existing admin/support permission boundary around the helper caller.
- `PER-001`: Customer cancelling an eligible order.
- `PER-002`: Authorized operations user cancelling an order.
- `PER-003`: Warehouse/vendor operations consuming accurate availability.

## Business rules

- `BR-001`: Cancellation reverses the original inventory delta exactly once.
- `BR-002`: Stock cannot be persisted below zero.
- `BR-003`: Product and variant rows are distinct inventory identities.
- `BR-004`: This task does not infer or rewrite historical inventory movements.

## Test expectations

- `TEXP-001` unit REQUIRED: shared relative-decrement behavior for product and
  variant rows.
- `TEXP-002` integration REQUIRED: customer cancellation restores product-only and
  variant quantities exactly.
- `TEXP-003` integration REQUIRED: admin/support cancellation restores quantities
  through the same contract.
- `TEXP-004` unit REQUIRED: zero-floor behavior prevents negative persistence.
- `TEXP-005` regression REQUIRED: order creation and Razorpay webhook still
  decrement by item quantity.
- `TEXP-006` security REQUIRED: unauthorized customer cancellation cannot mutate
  stock.
- `TEXP-007` regression REQUIRED: shipment/refund/status/error boundaries remain
  unchanged.
- `TEXP-008` exploratory OPTIONAL: concurrent cancellation/retry behavior is
  reviewed and remains coordinated with REN-144.

## Approval gate

This is an L3 inventory/order-integrity contract. The arithmetic correction is
recommended by the Linear issue, but the relative-delta correction and zero-floor
defense are high-consequence inventory decisions. Implementation may begin only
after explicit human confirmation of `DEC-001` and `DEC-002`, the independent Critic
review, and governance validation.
