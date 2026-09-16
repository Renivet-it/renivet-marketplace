# REN-227 Engineering Specification

## Scope

**Linear:** REN-227 — `[FCCP][P1] Investigate & Fix Customer Invoice-Availability Gap (BIZ-18)`  
**Branch:** `feat/ren-227-spec`  
**Phase:** specification, trace, and controlled implementation planning  
**Risk:** L3 — order lifecycle and financial-document availability

REN-227 must trace why qualifying customer orders do not receive `orders.invoice_number`, then fix the actual write-path failure for future orders. The existing customer download route is not to be replaced. Historical backfill is not authorized by this issue.

## Repository evidence

- `src/lib/db/schema/order.ts` defines nullable unique `orders.invoice_number` and `invoice_issued_at`.
- `src/app/api/delhivery/invoice/route.tsx` contains the only apparent writer for the marketplace order field: it locks the order, returns an existing number, allocates a brand/FY sequence, and updates the order.
- `src/app/api/invoices/[orderId]/download/route.tsx` requires the stored invoice number and signed token; it returns 403 when the field is absent. This route must remain unchanged in behavior.
- `src/components/dashboard/general/orders/order-action.tsx` and `src/components/dashboard/brands/orders/order-action.tsx` call `/api/delhivery/invoice` for Delhivery, while other paths call Shiprocket invoice generation and receive an external invoice URL. These paths require explicit reconciliation.
- `src/actions/shiprocket/generate-invoice.ts` calls the Shiprocket API and does not update `orders.invoice_number`.
- Existing corporate invoice tables/services are separate document flows and must not be conflated with the marketplace `orders.invoice_number` contract.

The Linear audit count of 8/146 populated invoice numbers and its referenced FCCP evidence are treated as issue-provided facts. Production data is not queried or changed during SPEC.

## Design and implementation boundary

1. First document every marketplace order path, shipment/carrier path, invoice writer, retry path, and customer/admin reader. The confirmed eligibility rule is delivery for both prepaid and COD orders.
2. Preserve the existing authoritative field until REN-225 establishes any replacement/canonical numbering contract. Do not invent a new format in REN-227.
3. Make the qualifying-order write idempotent and concurrency-safe: one order cannot receive two numbers or be overwritten after issuance. Preserve the database uniqueness constraint and existing sequence locking.
4. Ensure failures are visible and retryable without exposing sensitive order/payment data. A failed write must not look identical to an order that is not yet eligible.
5. Keep customer download authorization/token behavior, admin visibility, shipment behavior, corporate invoices, and historical records compatible.
6. Do not backfill missing historical numbers, add a second download endpoint, alter tax/TDS logic, or change production data without a separate explicit approval.

## Required evidence before implementation approval

- A written pre-fix call graph and root-cause statement on REN-227.
- An explicit eligibility matrix for paid/fulfilled/shipped/cancelled/unpaid/COD and carrier paths, confirmed by the business owner where it changes document availability.
- Representative new-order validation showing expected population, customer download, and admin visibility.
- Concurrency/retry evidence showing uniqueness and no overwrite.

## Confirmed decisions

- Customer invoice references are created after delivery for prepaid and COD orders.
- `orders.invoice_number` remains the marketplace field and must converge with REN-225’s approved numbering format.
- Issuance failures retry automatically and produce an admin-visible failure signal.

No production migration or historical backfill is implied.
