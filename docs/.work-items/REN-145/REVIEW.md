# REVIEW: REN-145 — Meta Purchase event currency unit and event fan-out correction

## Executive Result

`REVIEW_PASSED_WITH_FINDINGS`; drift `NO_DRIFT`; base branch `main`; base commit
`e7719c593157748314ed6ccaa63b412df7f39468`; head commit
`457db53d203e16f8835c490501fd3bff398cf6a1`. Governance re-entry is not required.

## Review Scope and Git Evidence

Reviewed the approved REN-145 contract, current Linear context, the base-to-HEAD
comparison, and uncommitted changes. Relevant implementation files are
`src/lib/analytics/meta-purchase.ts`, both checkout components, and
`src/lib/razorpay/payment.ts`; these include the untracked helper/test files shown by
Git status. Relevant tests are
`src/lib/analytics/meta-purchase.test.ts` and existing analytics tests.
The current branch is `ayanganguly333/corporate-order-qc`; Linear’s suggested REN-145
branch is recorded in the work item but is not the current checkout branch.

## Requirement Reconciliation

- `REQ-001`: PASS — `buildMetaPurchasePayload` converts paise to numeric INR rupees.
- `REQ-002`: PASS — both checkout flows use one full-cart Purchase dispatch.
- `REQ-003`: PASS — both transports receive the same constructed payload.
- `REQ-004`: PASS — each dispatch generates one shared Pixel/CAPI event ID.
- `REQ-005`: PASS — InitiateCheckout/PostHog code and CAPI kill-switch path are unchanged.
- `REQ-006`: PASS — no historical correction path was added.
- `REQ-007`: PASS — zero paise produces zero value.
- `REQ-008`: PASS — no new order idempotency mechanism was introduced.

## Scenario Reconciliation

- `SCN-001`, `SCN-002`, `SCN-003`, `SCN-004`, `SCN-005`: PASS by payload and call-site tests.
- `SCN-006`: PASS by complete-order gate and existing failure-isolation paths.
- `SCN-007`, `SCN-008`: PASS by unchanged source paths and existing regression tests.
- `SCN-009`: PASS by scope; no historical correction behavior exists.

## Invariant Reconciliation

- `INV-001` through `INV-006`: PASS by the shared payload builder, complete-order
  gate, unchanged transport boundary, and absence of migration/data changes.

## Flow and Architecture Review

`FLOW-001` and `FLOW-002` PASS. `meta-purchase.ts` is a small pure payload boundary;
Razorpay invokes the supplied purchase callback only when all expected brand orders
were created; COD/reward flows invoke it after their complete loops. The existing
four-argument `trackPurchaseCapi` interface is preserved.

## Security and Integration Review

`SEC-001` PASS: identity/address handling is unchanged. `INT-001` and `INT-002` PASS
by shared payload and event ID construction; the existing CAPI kill-switch remains in
`fb-capi.ts`. `INT-003` PASS by unchanged PostHog paths. No new secrets, schemas,
authorization boundaries, or external API contracts were introduced.

## Scope and Drift Review

`NO_DRIFT`. Changes are limited to the approved analytics behavior, a pure helper,
the Razorpay completion callback, focused tests, and task-local governance artifacts.
No production data, schema, dependency, or unrelated application behavior changed.

## Test Expectation Review

- `TEXP-001`–`TEXP-004`, `TEXP-006`, `TEXP-007`: PASS by inspected focused tests and
  existing regression coverage; runtime execution is recorded in the implementation
  handoff, not inferred as REVIEW evidence.
- `TEXP-005`: PARTIAL — source-level assertions exist, but Meta Events Manager sandbox
  verification requires external credentials/environment and was not performed here.
- `TEXP-008`: OPTIONAL and not needed for implementation acceptance.

## Findings

### REV-001

- Severity: LOW
- Category: test
- Description: Live Meta Events Manager sandbox verification remains outstanding.
- Evidence: `TEXP-005`; no external integration session or provider response is part of this review evidence.
- Impact: Real-provider event count/value behavior still needs operational confirmation.
- Recommendation: Run the approved single-brand and multi-brand sandbox orders in Meta Events Manager before production rollout.

### REV-002

- Severity: LOW
- Category: scope
- Description: Implementation is not currently checked out on Linear’s suggested REN-145 branch.
- Evidence: Git status reports `ayanganguly333/corporate-order-qc`; `task.branch` records `ayanganguly333/ren-145-meta-purchase-event-currency-unit-defect-and-per-brand-event`.
- Impact: Delivery/PR tooling may not associate the changes with REN-145 until the work is moved or the branch context is reconciled.
- Recommendation: Before opening the PR, ensure the implementation and task-local governance artifacts are on the intended REN-145 feature branch.

## Decisions Requiring Attention

None. `DEC-001` was resolved before implementation as one full customer-order event.

## Final Recommendation

`REVIEW_PASSED_WITH_FINDINGS`, `NO_DRIFT`, with no governance re-entry. Complete
`REV-001` before relying on production Meta reporting and reconcile `REV-002` before
opening the REN-145 PR.
