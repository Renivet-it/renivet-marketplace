# REN-227 Customer Invoice Availability

## Goal

Persist one canonical customer invoice reference when an order reaches delivered, for prepaid and COD orders, while keeping the existing customer download endpoint and making failures visible to operations.

## Architecture

- Extract the existing idempotent `orders.invoice_number` allocator from the Delhivery PDF route into a reusable server-only service.
- Invoke that service from the Shiprocket delivery webhook after the order is marked delivered.
- Retry invoice persistence with bounded backoff in the delivery flow; if all attempts fail, emit a deduplicated critical operational alert and preserve the shipment webhook response path.
- Keep `/api/invoices/[orderId]/download` unchanged and expose the persisted reference in the existing admin order operations data where available.

## Tech Stack

Next.js App Router, TypeScript, Drizzle ORM/Postgres, Bun tests, existing monitoring alerts.

## Spec

`docs/.work-items/REN-227/SPEC.md` — approved `READY_FOR_DEV` contract.

## Global Constraints

- No historical backfill or production-data mutation.
- No second customer invoice download endpoint.
- No overwrite or double allocation when a delivery webhook is duplicated.
- Preserve the existing invoice numbering contract pending REN-225 convergence.
- Use tests first and run Bun tests plus governance validation before completion.

## TDD Tasks

1. Add failing tests for the reusable delivery invoice orchestration: retry success, alert after exhaustion, and idempotent existing-reference behavior. (completed)
2. Implement the reusable invoice allocator/orchestrator and refactor the existing Delhivery route to use it. (completed)
3. Trigger invoice persistence from delivered shipment handling for both prepaid and COD orders, with structured alerting on failure. (completed)
4. Verify customer and admin consumers, run focused/full tests and governance validation, then review the diff against REN-227. (in progress)
