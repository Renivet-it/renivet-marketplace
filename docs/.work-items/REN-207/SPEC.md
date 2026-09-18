# REN-207 — Rolling 15-Day Settlement

## Status

`BLOCKED` for implementation by design: this issue delivers the assessment only and requires a separate implementation authorization. The assessment artifact is complete.

## Purpose

Document the fixed-window baseline and the impact of management's selected rolling 15-day-post-delivery settlement direction without changing production behavior.

## Repository evidence

- `src/lib/finance/payouts.ts` calculates delivered orders inside explicit `cycleStart`/`cycleEnd` dates and alerts on 1st/16th payout days.
- `src/lib/finance/payout-eligibility.ts` resolves delivery from the delivered shipment's `updatedAt` and holds COD/cash/split/ambiguous payment cases.
- `src/lib/db/schema/finance-compliance.ts` stores fixed cycle dates and status in `brand_payout_cycles`.
- `src/lib/trpc/routes/general/finance.ts` lets an authorized admin create cycles with explicit dates.
- `src/app/api/cron/finance/payout-cycle-alerts/route.ts` runs the existing scheduled-cycle alert behavior.

The full eight-area design/impact assessment is in `ASSESSMENT.md`.

## Out of scope

No rolling settlement implementation, schedule change, seller message copy, BIZ-4 assumption, eligibility rewrite, schema migration, production data change, or payout execution.

