# REN-210 — Automate Contracted Payment Fee

## Status

`BLOCKED` for Phase 2 implementation; Phase 1 evidence collection is incomplete.

## Confirmed scope

The issue requires the exact Payment Fee clause to be extracted verbatim from Terra Luna’s signed Annexure 4 before any calculation is implemented. The available audit transcription says “Rs. 20 or 2%, whichever is higher,” with Forward and Reverse/RTO chargeability, but it is not primary evidence and cannot authorize an engineering interpretation.

## Evidence gap

- The signed agreement PDF is not present in the repository.
- Base, rounding, per-order/line/transaction granularity, and Forward vs Reverse/RTO treatment are not independently confirmed from the document.
- The current admin-report calculations are unscoped, platform-wide, and explicitly described as an assumption; they are not an approved BIZ-14 implementation.
- No repository evidence documents the current manual reconciliation owner, timing, base, or record of entry.

## Phase 1 deliverables after evidence is supplied

1. Record the clause verbatim from the signed agreement.
2. Document each arithmetic and scope dimension, marking silent items “document does not specify.”
3. Document the current manual reconciliation process.
4. Identify applicable brands; all unconfirmed brands remain UNKNOWN.

## Phase 2 boundary

Only after Phase 1 is confirmed may engineering implement a distinct auditable payout deduction, scoped to the applicable agreement version. No fee is applied platform-wide, to brands without a confirmed agreement, or from the existing guessed report formulas. Commission, TDS, TCS, holdback, gateway-cost, and historical payout logic remain unchanged.
