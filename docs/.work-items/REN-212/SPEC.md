# REN-212 — COD & Split-Payment Payment-State Reconciliation

## Status

`BLOCKED` for final reconciliation-rule approval; this is a read-only discovery task.

## Purpose

Document how COD money moves from customer collection through carrier remittance to Renivet, how split payments map one Razorpay payment ID to multiple orders, which COD reconciliation tables are live, and what evidence should release a COD order for payout.

## Repository evidence

- `src/lib/finance/cod.ts` seeds delivered COD orders and syncs Delhivery/Shiprocket remittance rows.
- `fetchCarrierRemittanceRows()` returns an empty list when the carrier URL or token is missing, so “no rows” cannot distinguish no remittance from no connectivity.
- The populated COD family is `cod_reconciliation_runs` / `cod_reconciliation_items`; it stores expected/remitted amounts, status, AWB, and references.
- `orders.paymentId` is not a one-order payment guarantee; the issue reports multiple orders per payment ID.
- `src/app/api/cron/finance/cod-remittance-sync/route.ts` triggers the sync through a cron secret.
- Production credential state and actual carrier remittance data cannot be established from repository inspection.

## Proposed interim rule

Until COD payment evidence is confirmed, COD orders remain held and are not mapped to paid. No payment, remittance, refund, or credential state is changed by this task. The final aging, escalation, and permanent-hold policy remains for operational decision after the facts are collected.

## Required evidence before closing

1. Production credential state: set, unset, or set-but-failing, reported without changing credentials.
2. Carrier-to-bank money path with systems, tables, fields, and jobs.
3. Split-payment mapping and the meaning of per-order confirmation.
4. Live versus vestigial COD table family.
5. Current manual reconciliation owner/process and a proposed evidence-based rule.
