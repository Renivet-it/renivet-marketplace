# REN-206 Engineering Specification

## Scope

**Linear:** REN-206 — `[FCCP][P0] Add Payout Execution Safety Gate`  
**Branch:** `feat/ren-203-spec`  
**Risk:** L3 — payout execution and money movement

REN-206 must make the existing BIZ-3 payout block an enforced, fail-closed control. No payout may move from calculation/approval into money movement or statement issuance unless every required prerequisite is verified and an attributable management clearance has been recorded. This work must not create that clearance or execute a payout.

## Existing-gate investigation

No adequate execution gate exists today. `approvePayoutCycle()` marks brand summaries approved, and `executePayoutCycle()` checks only per-brand approval before calling Razorpay or generating manual instructions. Finance router access protects the procedures, but authorization is not a BIZ-3 readiness gate. The current ₹50,000 threshold permits an unapproved smaller override into the calculation. The only money-movement caller found is the finance TRPC `executePayoutCycle` route; the implementation review must re-check cron/scripts/routes before completion.

## Approved implementation direction

1. Add a pure, centrally callable execution-gate evaluator immediately before any brand loop or external payout call.
2. Require individually named, persisted evidence for commission validation, delivery/payment eligibility, BIZ-15 holdback suspension, real-transaction validation, and explicit human clearance. REN-203/204/205 outcomes are dependencies, not reimplemented logic.
3. Make the gate all-or-nothing for a cycle. A brand-specific execution request must evaluate the complete cycle gate before any brand is processed; a failed check leaves the cycle and all brand summaries unchanged.
4. Record every pass/fail evaluation with actor, timestamp, cycle, and bounded per-precondition results through the existing finance audit convention. Failure must include a stable reason code.
5. Require an approver on every payout override, regardless of amount. Do not infer approval from `amountPaise`, `createdBy`, or ordinary cycle approval.
6. Keep BIZ-3 part-4 clearance externally attributable and fail closed. The system may record a supplied clearance reference and approver identity, but engineering must not self-issue or auto-satisfy it.
7. Preserve existing cycle states and execution retry behavior unless the gate is failing; no payout, statement issuance, or execution transition is performed by this issue.

## Gate contract

The evaluator should return a deterministic result shaped around:

```text
allowed: false | true
reasons: [{ code, message }]
checks: {
  commission_validation,
  eligibility_gating,
  payment_state_gating,
  holdback_suspension,
  real_transaction_validation,
  human_clearance
}
```

All six checks are required. `human_clearance` is false when absent, expired, unattributed, or only represented by the ordinary `approvedBy` field. Unknown, stale, or malformed evidence fails closed.

## Data and state boundaries

An additive, auditable clearance record may be required because `approvedBy` is not BIZ-3 clearance. If implemented, it must contain cycle identity, clearance reference/evidence pointer, attributable actor, timestamp, status, and immutable audit linkage; it must not contain payment credentials or customer data. No existing order, payment, line-item, commission, holdback, or executed-cycle rows are rewritten. The cycle remains `calculated` or `approved` on a failed gate.

## Validation plan

- Unit-test every check failing individually and all checks passing without human clearance.
- Test every cycle state and repeated attempts for deterministic, idempotent behavior.
- Test override approval absent at amounts below and above ₹50,000.
- Test simulated external failure before and during multi-brand execution without double-payment or unrecoverable state.
- Enumerate all callers, routes, cron jobs, and scripts reaching execution and prove the gate is at the shared chokepoint.
- Use non-production fixtures only. Do not execute a payout or advance any G1–G6 audit gate.

## Explicit blocker for approval

The exact persistence and authority workflow for management’s BIZ-3 part-4 clearance is a high-consequence human decision. This specification recommends an immutable clearance record with an external evidence reference, but implementation must remain blocked until that recommendation is explicitly approved. Engineering must not treat ordinary admin approval as clearance.
