# REN-205 Engineering Specification

## Scope

**Linear:** REN-205 — `[FCCP][P0] Suspend the Unauthorized 5% Holdback Deduction (BIZ-15)`  
**Branch:** `feat/ren-203-spec`  
**Phase:** approved for implementation  
**Risk:** L3 — payout deduction behavior

REN-205 makes the BIZ-15 holdback suspension binding in payout calculation. No real payout cycle may deduct a holdback while the suspension is active, including when a brand has a configured holdback value. The holdback capability, schema, release logic, and history remain intact for a future explicit re-authorization.

## Evidence reviewed

- Linear REN-205 description, BIZ-15 decision, acceptance criteria, and validation requirements.
- `src/lib/finance/payouts.ts`: holdback defaults, holdback line creation, holdback release, cycle calculation, and payout-cycle state writes.
- `src/lib/db/schema/finance-compliance.ts`: commission-rule and brand-payout holdback fields, payout cycles, and line items.
- `src/components/pdf/brand-payout-statement-template.tsx`: statement rendering for holdback and holdback release lines.

## Approved design

1. Add an explicit holdback suspension gate owned by the payout calculation path and default it to off under BIZ-15.
2. Remove all `?? 500` or equivalent fallback behavior from active calculation. Missing or configured holdback values both result in zero holdback while suspension is active.
3. Preserve the existing enabled branch and `computeHoldbackRelease()` capability; when no holdback line was taken, release calculation returns zero without error.
4. Mark the suspension in cycle calculation metadata with the BIZ-15 authority so finance operators can distinguish an intentional suspension from missing data.
5. Do not render a holdback line in a statement when suspension is active and no holdback was taken. Preserve positive historical holdback/holdback-release lines if they already exist in historical output.
6. Do not modify commission, TDS/TCS, carrier claims, returns, order/payment data, production configuration, payout approval, or payout execution.

## Required validation

In a controlled read-only environment, inspect current brand holdback configuration and report it without mutation. Recalculate a **synthetic/non-production payout-cycle fixture** with structural characteristics equivalent to a real cycle (same line-item types, brand summaries, and metadata fields) and verify no new `holdback` line is produced, the BIZ-15 metadata is visible, the enabled test branch still computes correctly, and no other deduction changes.

**Management decision, 2026-09-20: the real `2026-06-H2` cycle must not be recalculated for this validation.** This SPEC originally named `2026-06-H2` as the reference fixture (kept here as historical context only, not as the current instruction) because it was the only populated real cycle available at the time this contract was approved. That choice is superseded — use an equivalent synthetic/non-production fixture instead.

## Approval gate

BIZ-15 is already a recorded management decision: the holdback is suspended pending documentary authorization. This contract is `READY_FOR_DEV`; re-enabling requires a separate explicit decision and is outside REN-205.
