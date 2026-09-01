# REN-175 Specification

## Goal

Route every corporate-order status transition through one authoritative guarded service so no endpoint or role can reach `ready_for_dispatch`, `dispatched`, or `delivered` without the required fulfillment and dispatch controls.

## Linear context

- Title: [Corporate Order] Route all order-status writes through one guarded transition (dispatch/QC bypass)
- Priority: Urgent
- Status: Backlog
- Label: Bug
- Assignee: Ayan Ganguly
- Branch context: `ayanganguly333/ren-175-corporate-order-route-all-order-status-writes-through-one`
- Relations: REN-176 (QC approval gate), REN-183 (warehouse-mode document requirement)

## Evidence and current behavior

`src/lib/services/corporate-order.ts:updateStatus` currently checks for a Fulfillment Order, requires a Delivery Challan for `direct_to_customer`, and requires an e-way bill for dispatches at or above Rs. 50,000. It then records status history and triggers the tax invoice path. The shared guard introduced by this issue must apply the dispatch prerequisites to direct `delivered` requests too; otherwise a bypass can skip `dispatched` entirely.

The following alternate writers bypass those checks:

1. `corporatePlatform.saveShipment` maps shipment status to an order status and directly calls `corporateOrderQueries.updateCorporateOrder`.
2. `corporatePlatform.updateBrandAssignedOrderStatus` directly updates the order after only checking brand membership; its router has no `isTRPCAuth` middleware.
3. `corporatePlatform.createDelhiveryForwardOrder` directly moves an order to `ready_for_dispatch` after creating a shipment.

Other writes found in the audit are creation, assignment, payment, or non-status field updates and do not represent alternate transitions into the guarded dispatch states. They remain outside this refactor unless implementation discovers a new direct status writer. Any implementation audit must explicitly distinguish these non-status updates from a status mutation.

## Design

Keep `corporateOrderService.updateStatus` as the public authoritative transition API, or extract its precondition, update, history, and transition side-effect logic into a shared helper used by that method and the platform service. Make guarded status persistence available only through that helper (or enforce an equivalent static/repository writer audit) so future direct `corporateOrders.status` writes cannot bypass it. Shipment creation/saving must not leave a shipment/order pair claiming a guarded status when the guard rejects it: validate the requested guarded state before persisting shipment status, or use one transaction with tx-aware queries and rollback. Delhivery's external API result must be reported separately from the local guarded transition outcome. Brand status updates must retain brand-membership and allowed-status checks, add `isTRPCAuth(BitFieldSitePermission.MANAGE_ORDERS)` at the router, and delegate the actual order transition to the shared guard while preserving brand audit/event notifications.

The guard must serialize competing transitions (transaction/row lock or conditional `WHERE status = expectedStatus`) and define same-target requests as idempotent no-ops with no duplicate history, audit, notifications, events, or tax-invoice attempts. Order state, transition history, and audit records must commit together; tax-invoice creation must be idempotent; email/provider effects are best-effort and logged with the resulting transition ID, never presented as evidence that a rejected transition succeeded.

The helper must preserve the current non-dispatch transition behavior and idempotent no-op behavior where an order already has the target status. It must apply the same checks for admin, brand, and shipment/Delhivery callers. QC approval is a dependency on REN-176: add the QC predicate at the shared guard boundary when the QC state exists, never as a duplicated endpoint check. Per owner confirmation, warehouse-mode guarded dispatches fail closed until REN-183 adds the inbound receipt/GRN requirement; REN-175 must not invent or bypass that requirement.

## Security and data consistency

`updateBrandAssignedOrderStatus` is a security boundary. A caller must be authenticated, have `BitFieldSitePermission.MANAGE_ORDERS`, belong to the assigned brand, and pass the same transition guards as an admin. Status history, audit log, notification, tax-invoice trigger, and shipment status must not claim a successful guarded transition when the guard rejects it. Until REN-183 adds the inbound receipt/GRN, guarded warehouse transitions fail closed with an explicit precondition error (owner-confirmed policy).

## Out of scope

Building QC approval, generating e-way bills, defining warehouse-mode documents, changing database schema, or changing customer-facing status labels.

## Verification

Focused service/router tests will exercise each bypass with missing documents, an allowed transition with all current documents, unauthorized brand access, and a non-dispatch transition. The full Bun suite and governance validator must pass. `$renivet-review REN-175` is required after implementation.
