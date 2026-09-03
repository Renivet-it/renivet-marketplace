# REN-183 — Warehouse delivery-mode dispatch control

## Outcome

Both corporate delivery modes must pass the same guarded production → QC → authorization gate before dispatch. Direct delivery continues to require an issued Delivery Challan. Warehouse delivery must require a recorded inbound goods-received note (GRN) for the selected Fulfillment Order before `ready_for_dispatch` or `dispatched`.

## Repository evidence

- `CorporateOrderService.updateStatus` is the shared status writer and currently checks the FO, Delivery Challan for `direct_to_customer`, QC approval, and high-value e-way bill requirements (`src/lib/services/corporate-order.ts:1120-1235`). Warehouse mode currently throws an unconditional “inbound goods-received” error because no record exists.
- `corporateDeliveryChallans` is the direct-mode document and is queried through the order document chain (`src/lib/db/schema/corporate-platform.ts`, `src/lib/db/queries/corporate-order.ts`). There is no corporate inbound receipt/GRN table or mutation.
- Shipment save and Delhivery forward-order/pickup paths eventually call the shared status guard (`src/lib/services/corporate-platform.ts:3219`, `:3674`, `:5215`).
- The document-chain panel still says warehouse fulfilment has no required document (`src/components/dashboard/general/corporate-orders/corporate-document-chain-panel.tsx:331-335`).
- Existing shipment/RTO inbound concepts are logistics records, not an authenticated receipt of the supplier’s goods at Renivet’s warehouse; reusing them would conflate shipment tracking with receipt authorization.

## Approved design

1. Add a minimal `corporate_warehouse_goods_receipts` record linked to `corporate_order_id`, selected FO, brand, receiving warehouse, received quantity, receipt date/time, receiver user, optional supplier delivery reference/AWB, status, and audit timestamps. A receipt is valid only when it is recorded/accepted for the current FO and quantity is sufficient for the FO; no GRN file upload is required.
2. Add an admin-only manual “goods received” action. It records the order/FO, receiver/date/quantity, warehouse, and optional delivery reference. No upload is required. It uses `MANAGE_ORDERS`; corrections preserve prior audit records. Use an order+FO idempotency key, optimistic versioning, and a transaction/row lock covering GRN validation plus the guarded status CAS. “Current” means the receipt references the latest issued FO and quantity; FO reissue/cancellation invalidates older receipts. Multiple receipts may accumulate, but dispatch requires their accepted total to meet the FO quantity.
3. Extend the shared `updateStatus` precondition: for `renivet_warehouse`, require an accepted current GRN for the selected FO, in addition to the existing FO and QC checks. For `direct_to_customer`, preserve the existing Delivery Challan requirement unchanged. Apply the same guard to `ready_for_dispatch`, `dispatched`, and `delivered` transitions as the current central model dictates.
4. Expose the GRN in `getOrderById`/document-chain responses and replace the “not required” UI note with the current status, receipt action, and blocking explanation. The Delhivery/manual shipment workflow remains downstream of authorization; it must not bypass the guard.
5. Enforce one current accepted receipt per FO with a database constraint/transaction. Concurrent receipt corrections and status transitions must fail closed; a stale receipt or receipt for another FO/order cannot satisfy the guard.
6. Add an additive migration. Existing warehouse orders remain readable but are not grandfathered into dispatch authorization without a current accepted GRN. Existing direct-mode orders and challan behavior remain unchanged.

## Shipping representation

The order’s explicit `customerShippingCharge` classification (`NOT_CHARGED`, `INCLUDED_IN_SUPPLY`, or `SEPARATELY_CHARGED`) remains the source for documents. For the Mili AI pilot it is `NOT_CHARGED`; documents must show Bill To, Ship To, Delivery Mode, and “Customer Shipping Charge = none” rather than an invented ₹0 shipping line. Finance/CA must decide any future separately-charged freight tax treatment; this issue does not assume a rate.

## Delivery-mode behavior

- Manual/direct mode: the brand delivers to the customer, uploads the Delivery Challan, and updates delivery status. An admin may manually mark it delivered because Renivet does not track that leg.
- Warehouse mode: the brand notifies Renivet; an admin manually confirms “goods received at warehouse,” then Renivet ships through the existing flow after QC. This is a lightweight manual control, not a full WMS or blocking file-upload requirement.

## Permission and status matrix

- Brand members may upload the direct-mode Delivery Challan and update the assigned order through the existing brand-assigned status path. The server must enforce that the order is `direct_to_customer` and reject brand attempts to transition warehouse orders or mark them delivered outside the permitted direct-mode matrix.
- Only an order admin with `MANAGE_ORDERS` may record the warehouse goods-received confirmation, move a warehouse order into dispatch authorization, or manually mark a direct-mode order delivered.
- Brand challan upload must use a brand-scoped mutation that verifies assignment/membership; an admin-only challan mutation is not sufficient for the brand workflow.
- The shared server-side guard remains authoritative; UI controls and brand-submitted status values cannot bypass it.

## Required validation and authorization

- GRN must identify the exact order and FO, have a valid date, receiver, warehouse, and positive quantity not exceeding the FO quantity.
- Only an authenticated order admin with `MANAGE_ORDERS` may record/accept/reject a GRN or authorize the status transition.
- Brand members cannot self-approve warehouse receipt authorization unless a separate permission is explicitly approved; their supplier shipment evidence may be attached but is not itself an accepted GRN.
- Status checks must be server-side and shared; UI checks are informational only.

## Out of scope

Full warehouse inventory/WMS, stock allocation, barcode scanning, automatic carrier proof-of-delivery ingestion, and freight tax policy decisions.

## Test expectations

- Warehouse order with FO + QC but no GRN is rejected for `ready_for_dispatch` and `dispatched`.
- Warehouse order with a current accepted sufficient-quantity GRN is allowed through the shared guard.
- Wrong order/FO, rejected/stale/insufficient-quantity GRNs fail closed.
- Direct-mode dispatch still requires the Delivery Challan and is unaffected by GRN records.
- Admin permission, tenant/brand isolation, idempotent retry, concurrent receipt replacement, and migration behavior are covered.
