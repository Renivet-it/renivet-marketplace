# REN-210 — Automate Contracted Payment Fee

## Status

`READY_FOR_DEV` for the confirmed Terra Luna implementation.

## Confirmed scope

The user has explicitly confirmed that Akshay internally approved the reconciliation logic: `max(2% of order total, ₹20)`, charged for Forward and Reverse/RTO. This is scoped to Terra Luna and remains separate from Razorpay gateway cost.

**[2026-09-20 clarification]** The formula itself — `max(2% of order total, ₹20)` — is now a confirmed authoritative business decision (see `docs/enhancement-improvements/execution-readiness/FINANCIAL_COMPLIANCE_BASELINE/AUDIT_PROGRAM/DECISION_REGISTER.md` Business item #14 and `RUNS/A10_DECISION_CLOSURE/DECISION_TRACKER.md` BIZ-14, both updated 2026-09-20). **The formula confirmation does not extend to Forward vs. Reverse/RTO chargeability scope, which remains explicitly UNKNOWN/unconfirmed** — this line's "charged for Forward and Reverse/RTO" phrasing predates that clarification and should not be read as a settled scope decision. This is consistent with, not a contradiction of, the "Evidence gap" section immediately below, which already flags Forward vs Reverse/RTO treatment as not independently confirmed.

## Evidence gap

- The signed agreement PDF is not present in the repository; temporary source status is internally confirmed by Akshay.
- Base, rounding, per-order/line/transaction granularity, and Forward vs Reverse/RTO treatment are not independently confirmed from the document.
- The current admin-report calculations are unscoped, platform-wide, and explicitly described as an assumption; they are not an approved BIZ-14 implementation.
- No repository evidence documents the current manual reconciliation owner, timing, base, or record of entry.

## Phase 1 deliverables after evidence is supplied

1. Record the clause verbatim from the signed agreement.
2. Document each arithmetic and scope dimension, marking silent items “document does not specify.”
3. Document the current manual reconciliation process.
4. Identify applicable brands; all unconfirmed brands remain UNKNOWN.

## Phase 2 implementation

Implement a distinct auditable payout deduction using `max(2% of order total, ₹20)` for Terra Luna only. No fee is applied platform-wide or to brands without a confirmed agreement. Commission, TDS, TCS, holdback, gateway-cost, and historical payout logic remain unchanged.
