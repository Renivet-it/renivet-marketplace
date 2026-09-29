# REVIEW: REN-245 — Improve grievance submission, identity matching, and customer grievance portal

## Executive Result

`REVIEW_PASSED_WITH_FINDINGS`. The implementation remains within the approved REN-245 contract with `MINOR_DRIFT` limited to incomplete dedicated integration/component test evidence. Governance re-entry is not required. Comparison base is `main` at `58a5a2b2d236449d788e0f26a988d1eadb6e2591`; implementation head is `4cb7fd40a0bc10822b798ad4e6216902209afd55`.

## Review Scope and Git Evidence

- Linear issue: REN-245, “Improve grievance submission, identity matching, and customer grievance portal”.
- Work item: `docs/.work-items/REN-245/work-item.yaml`; status `READY_FOR_DEV`; approval `APPROVED`; design blockers empty.
- Base branch: `main`; base commit: `58a5a2b2d236449d788e0f26a988d1eadb6e2591`.
- Head commit: `4cb7fd40a0bc10822b798ad4e6216902209afd55`.
- PR URL: `null`.
- Working tree was clean during review.
- The diff adds the grievance claim migration/schema, validation and identity modules/tests, guest-flow claim handling, public form changes, protected grievance portal, profile navigation, and the legal/user-support route changes.

## Requirement Reconciliation

- `REQ-245-1`: PASS. `src/lib/grievance/validation.ts` is used by the public form and `legal.submitGrievance`; phone/email are normalized and validated before persistence.
- `REQ-245-2`: PASS. `src/app/(home)/contact/page.tsx` prefills authenticated contact values, requires explicit edit action, and does not mutate the profile.
- `REQ-245-3`: PASS. `src/app/(protected)/profile/grievances/page.tsx`, `grievances-page.tsx`, profile navigation, and existing protected support procedures provide history, status, timestamps, category, order reference, messages, and replies.
- `REQ-245-4`: PASS. `identity.ts` and `legal.ts` handle exact match, conflict, and no-match outcomes without returning account identity details.
- `REQ-245-5`: PASS. `claims.ts`, `grievance-claim.ts`, migration `0285_grievance_claims.sql`, and `claimGuestGrievance` provide the approved consent-gated, opaque, expiring, single-use handoff.
- `REQ-245-6`: PASS. `user-support.ts` keeps grievance listing protected and user-scoped; existing detail/message/reply procedures retain ownership checks.
- `REQ-245-7`: PASS. `legal.ts` preserves grievance priority, acknowledgment SLA, order/category fields, audit/alert side effects, and the existing admin queue data model.

## Scenario Reconciliation

- `SCN-245-1` and `SCN-245-2`: PASS in the form/schema implementation; invalid identity values receive field errors and authenticated values are explicitly editable.
- `SCN-245-3` and `SCN-245-8`: PASS through the protected support router plus `canAccessCustomerGrievance` ownership guard.
- `SCN-245-4`, `SCN-245-5`, and `SCN-245-6`: PASS through `resolveGrievanceIdentity`, `decideGuestGrievanceResolution`, and the legal mutation branches.
- `SCN-245-7`: PASS through claim expiry, atomic consumption, generic errors, and the unique consumed state.
- `SCN-245-9`: PASS by preservation of the existing ticket creation and side-effect path.

## Invariant Reconciliation

- `INV-245-1`: PASS via shared normalization before matching/insertion.
- `INV-245-2`: PASS via authenticated support procedures and user-scoped grievance listing.
- `INV-245-3`: PASS via explicit conflict handling and generic guest responses.
- `INV-245-4` and `INV-245-5`: PASS via hashed, expiring claims and transactionally grouped consume/link/create behavior.
- `INV-245-6`: PASS via reuse of existing ticket, SLA, audit, alert, category, order, and message semantics.

## Flow and Architecture Review

- `FLOW-245-1`: PASS. Public form → shared validation → identity resolution → ticket/claim persistence → existing operational side effects is implemented in the public contact form and `legal.ts`.
- `FLOW-245-2`: PASS. Profile navigation → grievance list → existing ticket detail/reply flow is implemented without a parallel ticket model.
- `FLOW-245-3`: PASS. Consent → existing Clerk route handoff → opaque claim → authenticated claim consumption is represented by `accessPath`, `grievance_claims`, and `claimGuestGrievance`.
- `DEP-245-1`, `DEP-245-2`, and `DEP-245-3` are used within the approved boundaries. `INT-245-1`, `INT-245-2`, and `INT-245-3` are preserved or explicitly handled in the changed route.

## Security and Integration Review

- `SEC-245-1`: PASS. Customer list access is protected and filtered by the authenticated user ID; existing detail/message/reply authorization remains in the protected router.
- `SEC-245-2`: PASS. Exact-match, conflict, and no-match responses do not expose account IDs, ticket IDs, or account existence details.
- `SEC-245-3`: PASS. Only a hash of the opaque claim is persisted; claims expire and are consumed once; raw credentials and auth tokens are not stored.
- The claim consume and ticket creation transaction prevents a successful retry from creating a second linked ticket. Audit/alert failures remain post-transaction operational failures, consistent with the existing side-effect boundary.

## Scope and Drift Review

The changed files are within the approved scope: grievance form, legal/support routes, protected profile portal, grievance claim persistence, tests, and task-local governance artifacts. No unrelated dependency, production configuration, or external account mutation was added.

Drift classification: `MINOR_DRIFT`. The implementation is behaviorally compatible with the approved contract; the only finding is incomplete dedicated route/component integration-test evidence.

## Test Expectation Review

- `TEXP-245-1`: PASS — `validation.test.ts` covers normalization and validation cases.
- `TEXP-245-2`: PARTIAL — the form implements prefill/edit behavior, but no dedicated component test was found.
- `TEXP-245-3`: PARTIAL — `portal.test.ts` covers the ownership predicate, but no dedicated router-level IDOR test was found.
- `TEXP-245-4`: PARTIAL — identity and guest-flow unit tests cover decision outcomes, but no route/database integration test was found.
- `TEXP-245-5`: PARTIAL — claim token/expiry and guest-flow tests exist, but no Clerk handoff or transaction integration test was found.
- `TEXP-245-6`: PARTIAL — existing behavior is preserved in the changed route, but no new regression test was found for admin/SLA/audit/alert behavior.

## Findings

### REV-001

- Severity: LOW
- Category: test
- Description: The implementation has focused unit coverage, but dedicated component, router/security, integration, and regression tests required by `TEXP-245-2` through `TEXP-245-6` were not found in the diff.
- Evidence: `src/lib/grievance/*.test.ts` covers validation, identity, guest decisions, claim primitives, and the ownership helper; no dedicated tests were found for `contact/page.tsx`, `legal.submitGrievance`, `legal.claimGuestGrievance`, `user-support.listMyGrievances`, or the preserved admin side effects.
- Impact: Future regressions in the UI handoff, database transaction, route authorization, or operational side effects may not be caught automatically.
- Recommendation: Add component and route/integration tests for the approved scenarios before merging the branch.

## Decisions Requiring Attention

None. The approved `DEC-245-1`, `DEC-245-2`, and `DEC-245-3` decisions are reflected by the implementation.

## Final Recommendation

`REVIEW_PASSED_WITH_FINDINGS`. No blocker or governance re-entry is required. The branch is suitable for review/PR handoff, with `REV-001` recommended before merge.
