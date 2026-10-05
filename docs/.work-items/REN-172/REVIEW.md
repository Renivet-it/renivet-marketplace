# REVIEW: REN-172 — Cross-tenant authorization bypass across 51 brand-router procedures (includes F10's 6 Unicommerce procedures)

## Executive Result

REVIEW_PASSED_WITH_FINDINGS. The implementation is within the approved no-schema authorization design and adds a shared direct-brand guard plus explicit resolved-brand checks. The remaining finding is test-evidence coverage: the repository test is structural and does not yet execute a table-driven negative case for every affected procedure.

Base commit: `39010ae11c2227853bc9517c3b000cec62d5b4ac` (`origin/master`). Head commit: `2b6394d38c156537e65862a4e8795871819ee84d`. Material drift: NO_DRIFT. Governance re-entry: not required.

## Review Scope and Git Evidence

The REN-172 implementation is the separately pushed commit `2b6394d38c156537e65862a4e8795871819ee84d` on `ayanganguly333/ren-254-c1-security-guard-hardening`. The implementation changes `src/lib/trpc/trpc.ts` and the affected brand routers; the focused contract test is `src/security/ren-172-ownership.test.ts`. No migration or schema file changed.

## Requirement Reconciliation

- REQ-001 / REQ-006: PASS. `isTRPCAuth` now applies `requireOwnBrand` to direct `input.brandId` values, covering the six Unicommerce procedures and other direct-brand procedures.
- REQ-002 / REQ-003: PASS. Role writes are covered by the shared direct-brand guard; member role binding has an explicit resolved-brand check in `members.ts`.
- REQ-004: PASS. Existing REN-254 confidential ownership checks reject non-owner access before confidential writes or Shiprocket/Delhivery calls; `getBrandWithConfidential` checks access before returning confidential data.
- REQ-005: PASS. Analytics direct-brand procedures and shipment lookup have explicit ownership enforcement.
- REQ-007: PASS. The six named product surfaces have active ownership enforcement, including the required product lookups for journey/value updates.

## Scenario Reconciliation

SCN-001, SCN-002, SCN-003, SCN-004, SCN-005, SCN-006, and SCN-007 are represented by the shared guard, resolved-brand checks, existing confidential/role controls, and `src/security/ren-172-ownership.test.ts`. SCN-008 remains a manual concurrency exclusion as specified.

## Invariant Reconciliation

INV-001 through INV-005 are preserved by the shared comparison utility, explicit target resolution, and site-admin bypass. No state transition or persistence model was introduced.

## Flow and Architecture Review

The implementation follows the approved shared-comparison/per-procedure-resolution design. Direct inputs are rejected in the authorization middleware before the procedure body. Resolved targets are checked immediately after the existing lookup and before mutation or external side effects. No schema, migration, dependency, or permission-model redesign was added.

## Security and Integration Review

Cross-brand rejection emits `type: "cross_brand_rejection"` operational alerts with brand entity identity and a procedure/user/brand dedupe key. Alert failure is fail-closed for the authorization decision. Platform site administrators retain the approved bypass. External integrations are reached only after the ownership gate on the affected paths.

## Scope and Drift Review

NO_DRIFT. The implementation remains inside the approved brand-router authorization scope and makes no database or production-configuration changes.

## Test Expectation Review

PARTIAL. `src/security/ren-172-ownership.test.ts` statically verifies the shared guard, alert convention, all named direct/resolved procedure surfaces, and the admin bypass. The approved TEXP/scenario design calls for executable negative tests per procedure; those tests are not present in this repository yet.

## Findings

### REV-001

- Severity: MEDIUM
- Category: test
- Description: The approved per-procedure runtime authorization matrix is not present; current REN-172 coverage is structural.
- Evidence: REN-172 SCN-001/SCN-002/SCN-004/SCN-007 and `src/security/ren-172-ownership.test.ts`.
- Impact: Runtime behavior for every affected procedure is not independently exercised before staging.
- Recommendation: Add the table-driven cross-brand negative matrix and side-effect assertions before release validation.

## Decisions Requiring Attention

None.

## Final Recommendation

Proceed with the implementation commit for code review and staging validation. Keep REV-001 open as a release-quality follow-up; it is non-blocking for the approved implementation review but should be completed before production release.
