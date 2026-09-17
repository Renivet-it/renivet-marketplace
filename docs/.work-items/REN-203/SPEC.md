# REN-203 Engineering Specification

## Scope

**Linear:** REN-203 — `[FCCP][P0] Remediate Commission Calculation & Validate Payout Amounts`  
**Branch:** `feat/ren-203-spec`  
**Phase:** specification and risk review only  
**Risk:** L3 — financial/payout calculation behavior

REN-203 corrects the commission-rate unit boundary used by payout calculation and establishes fail-closed behavior for brands without an approved rate. It must preserve effective-dated rule resolution, seller-attributable commission-base semantics, payout-cycle safety, and historical records. It does not execute payouts, change holdback behavior, populate production commission rules, or decide commercial rates for unapproved brands.

## Evidence reviewed

- `src/lib/finance/payouts.ts`: `ResolvedRule.commissionPercentBps`, in-memory rule resolution, the `category.commissionRate ?? 2000` fallback, and commission calculation using `/ 10_000`.
- `src/lib/db/schema/finance-compliance.ts`: canonical `commissionRules.commissionPercentBps` storage, effective dates, scope fields, and payout-cycle states.
- `src/lib/db/schema/order.ts`: order-level `discountAmount`/`couponDiscountAmount`; no seller-funded versus platform-funded discount fields on order items.
- `src/lib/db/queries/finance-compliance.ts`: active-rule and finance-window queries, including delivered-date handling in the payout layer.
- `src/lib/finance/calculations.ts`: existing basis-point convention for tax calculations.
- Existing focused baseline: `bun test src/lib/finance/calculations.test.ts` — 2 passed.

The Linear issue references FCCP decision-pack files under `RUNS/`, but those files are not present in this checkout. Their exact BIZ-13/BIZ-3 option text and the independent transaction evidence therefore cannot be treated as locally verified.

## Proposed design

1. Keep `commission_rules.commission_percent_bps` as the sole persisted internal unit: integer basis points, where `10000 = 100%`.
2. Make the unit explicit at every boundary through names/types and a single conversion helper. No plain percentage may reach payout arithmetic. Remove the mixed-unit fallback and never substitute an unapproved number.
3. Resolve active rules against the delivered timestamp/date, preserving scope specificity, priority, effective-from/effective-to boundaries, and deterministic tie handling.
4. Represent Terra Luna’s approved values only in a narrowly scoped, auditable path for Terra Luna (`a8e54f13-228d-452c-8292-f1dd7b07dcb3`): 25% for approved applicable categories and 20% for Personal Care. Production rule population remains outside REN-203 and belongs to the approved commercial-configuration path (REN-209); the implementation must not silently turn missing production configuration into a rate.
5. For every other brand, and for Terra Luna when no approved effective rule matches, return an explicit unconfigured result and prevent a payable commission amount from being silently calculated. The exact presentation/line-item representation requires approval below.
6. Preserve the current seller-attributable-base rule. Because the schema has no seller/platform discount distinction, do not invent a field or infer funding ownership; record the schema gap and keep the behavior bounded until the authoritative source is approved.
7. Do not alter holdback calculation (REN-205), payout eligibility (REN-204), payout safety release (REN-206), production data, historical line items, or cycle execution/approval transitions.

## Required manual validation

Before implementation is approved for release, recalculate one real Terra Luna transaction independently and reconcile the 2026-06-H2 ten-line-item fixture. Validation must be read-only/controlled and must not execute, approve, or unblock a payout cycle.

## Approval gate

This specification remains blocked pending explicit finance/product confirmation of:

- the approved BIZ-13/BIZ-3 commission-base/rate option and the authoritative representation of Terra Luna’s 25%/20% rules without an REN-209 production configuration change;
- whether an unconfigured brand is omitted from commission output or emitted as a blocked/flagged line with zero payable amount;
- the authoritative seller-funded/platform-funded discount source or acceptance of the documented schema gap for this release.

REN-206 must remain blocked until REN-203, REN-204, and REN-205 are complete and the real-transaction validation has explicit clearance.
