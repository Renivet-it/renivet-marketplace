# REN-204 Engineering Specification

## Scope

**Linear:** REN-204 — `[FCCP][P0] Enforce Payout Eligibility & Payment-State Gating`  
**Branch:** `feat/ren-203-spec`  
**Phase:** specification and risk review  
**Risk:** L3 — payout eligibility and payment-state behavior

REN-204 corrects payout candidate selection so delivered orders are selected by defensible delivery time rather than creation time, require confirmed payment evidence, explicitly hold unresolved COD/split-payment cases, and cannot be paid twice across completed cycles. It does not write order or payment state, change commission calculation, execute or approve payouts, backfill production data, or implement rolling settlement.

## Evidence reviewed

- Linear REN-204 description, acceptance criteria, dependencies, and decision references.
- `src/lib/finance/payouts.ts`: `getOrderDeliveredAt`, the delivered-order candidate loop, cycle calculation, line-item persistence, and payout-cycle state writes.
- `src/lib/db/queries/finance-compliance.ts`: `listOrdersForFinanceWindow`, which currently filters by `orders.createdAt`, and the existing paid/payment-id query path.
- `src/lib/db/schema/order.ts`: order status, payment status, payment method, and payment ID fields.
- `src/lib/db/schema/order-shipment.ts`: delivered shipment status and timestamp fields.
- `src/lib/finance/cod.ts`: existing COD reconciliation statuses and provider/remittance behavior.
- `src/lib/db/schema/finance-compliance.ts`: payout cycles and payout line-item references.

## Proposed design

1. Query a broad enough order window for the cycle and resolve eligibility in the payout candidate path using a defensible delivery timestamp, not `createdAt`.
2. Treat a shipment with `status = delivered` and a valid `updatedAt` as the delivery source. If no defensible delivery timestamp exists, exclude the order with a structured reason; never use `createdAt`, `updatedAt`, or `new Date()` as a delivery substitute.
3. Require `orders.status = delivered`, confirmed payment evidence, and the existing approved refund/payment safeguards. Prepaid orders require `paymentStatus = paid` and a non-empty payment ID. Unknown or unconfirmed states are not eligible.
4. Hold COD and split-payment orders with a visible, queryable `cod_reconciliation_pending` reason until the separate REN-212 reconciliation design defines an approved paid mapping. Do not infer that COD or partial payment is confirmed paid.
5. Before selecting an order item, check completed/settled prior-cycle payout line items by order reference. A previously settled order cannot re-enter a later cycle.
6. Preserve inclusive cycle boundaries, deterministic ordering, idempotent recomputation, current commission/holdback behavior, and payout-cycle state transitions. REN-204 only changes candidate eligibility and its explainable reasons.
7. Keep exclusion/hold reasons in the calculation evidence available to finance operators without exposing customer or payment-sensitive data.

## Required manual validation

Re-run the A02 reproduction in a read-only controlled environment, record before/after candidate counts, verify the delivered-before-window-created case is included, verify unconfirmed-payment cases remain excluded/held, and verify no payout cycle advances toward execution.

## Approval gate

The requester approved the recommended COD/split-payment behavior: hold with a queryable `cod_reconciliation_pending` reason until REN-212 defines the reconciliation rule. This is now `READY_FOR_DEV`; implementation must not map uncertain COD or split-payment states to paid.
