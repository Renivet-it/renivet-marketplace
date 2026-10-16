# REN-253 C0 Payout Containment Design

## Purpose

Make the payout path fail closed around five known controls before any later management decision can clear a real payout. REN-253 does not approve, clear, or execute a payout.

## Confirmed decisions

- Commission fallback: remove the unapproved fallback or return an explicit unconfigured result. Never infer a rate. Terra Luna's approved target remains scoped to Terra Luna.
- Recalculation: allow only `draft` and `calculated`; reject `approved`, `processing`, `completed`, and `failed`.
- Statement access: allow authenticated users with existing `payouts` finance-module `canView` or `canManage`, plus site Admin users through existing finance access inheritance. Existing brand roles alone do not grant access.
- Payout replay: use one stable cycle-and-brand reference. A repeated request must not create a second provider payout or re-submit a completed payout.
- RTO fault owner: make Return/Replace `setRtoAttribution` the only authoritative path, retaining its lock check and audit record. Order Operations must route through the same logic or stop editing this field directly.
- Evidence ownership: Ayan collects read-only deployment/migration evidence; Akshay reviews it and owns the C0 release decision.

## Scope

1. Remove or fail-closed the unapproved commission fallback without inventing commercial policy.
2. Add a status guard to `calculatePayoutCycle` using the approved state set.
3. Protect the payout statement route with existing finance access checks.
4. Enforce clearer/executor separation and stable payout replay protection at the execution boundary without executing payouts during development or testing.
5. Eliminate the independent Order Operations `faultOwner` write path and preserve the lock/audit behavior of Return/Replace attribution.
6. Produce implementation, test, staging, and read-only deployment/migration evidence. Release remains separately owned and approved.

## Out of scope

First real payout, payout clearance, new commission policy, broad finance refactor, payee-identity C1 controls, RTO fee-allocation policy, tax policy, schema redesign unless a minimal additive idempotency record is proven necessary, production-data mutation, and unrelated cleanup.

## Repository evidence

- `src/lib/finance/calculations.ts` still accepts and applies `fallbackRateBps`.
- `src/lib/finance/payouts.ts:759` recalculates without a visible cycle-state guard.
- `src/app/api/finance/payouts/[cycleId]/statement/[brandId]/route.tsx` currently has no authentication or finance access check.
- `src/lib/finance/access.ts` and `src/lib/trpc/routes/general/finance.ts` already provide per-user `payouts` view/manage access and site-admin inheritance.
- `src/lib/finance/payouts.ts:1098` already blocks execution unless the cycle is `approved`; `executePayoutCycle` still needs the approved replay/separation design applied consistently.
- `src/lib/trpc/routes/general/order-ops.ts:491` writes `faultOwner` directly.
- `src/lib/trpc/routes/general/returnReplace.ts:397` checks locked payout cycles and writes a finance audit event.

## Design

The implementation will reuse existing access, audit, and query patterns. Tests will be written first for each control. No test will call a live payout provider or mutate production data.

The calculation guard will reject invalid states before reading or replacing line items. The statement route will invoke the same finance access decision used by the finance router and will return unauthorized/forbidden responses before loading statement data. Execution will derive a deterministic cycle-and-brand idempotency reference, reject an already completed local execution, and pass the same reference to the provider-facing request path. The RTO mutation will be centralized behind the existing lock-aware audited procedure; Order Operations will no longer independently update `faultOwner`.

## Required tests

- Commission fallback: approved rule, missing rule, non-Terra brand, and no silent numeric fallback.
- Recalculation: `draft` and `calculated` allowed; `approved`, `processing`, `completed`, and `failed` rejected without replacing line items.
- Statement access: unauthenticated, no payout access, payout view, payout manage, site Admin, and cross-brand attempts.
- Execution: same actor cannot clear and execute when separation is required; repeated cycle-and-brand submission is rejected or deduplicated; no partial replay.
- RTO: unlocked authorized update succeeds with audit evidence; locked update fails; Order Operations cannot bypass the canonical path.
- Existing finance regression tests remain green.

## Release and evidence

Implementation evidence must link the PR, tests, staging deployment, commit, environment/database class, and read-only deployment/migration verification. Ayan records the evidence. Akshay decides whether C0 may proceed through the release path. The work itself never clears or executes a payout.

## Approval state

Design decisions are recorded in Linear REN-253. This written design requires human review before the implementation plan and code changes begin.
