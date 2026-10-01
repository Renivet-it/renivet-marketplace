# REVIEW: REN-254 — [C1] Security Guard Hardening — Stage 3A ten-item no-schema checklist

## Executive Result

REVIEW_PASSED_WITH_FINDINGS. The implementation stays within the approved contract with NO_DRIFT. Base is `master` at `e6ebd297ecbc09ad283d3e5b2e850d1d9f7876be`; head is `1cbc2bdf55646789a4d790abad52bbb18709bba4`; no PR URL is available and the working tree is clean after the implementation commit. Governance re-entry is not required, but REN-172 evidence and release evidence remain open prerequisites to closure.

## Review Scope and Git Evidence

Compared the approved REN-254 work item, SPEC, Critique, and implementation plan with the base-to-head diff. The implementation changes only authorization boundaries, destructive-operation handling, invite consumption, return/replace state guards, server-action guards, user anonymization, and focused tests. No schema, migration, permission-model redesign, or REN-172 implementation was added.

## Requirement Reconciliation

- REQ-254-001: PASS — brand role creation/update force `sitePermissions` to the zero text value.
- REQ-254-002: PASS — confidential mutations check the target brand owner/site-admin policy; sensitive identity changes reset verification state.
- REQ-254-003: PASS — confidential reads require brand ownership or site `VIEW_BRANDS` before the confidential query.
- REQ-254-004: PASS — order deletion is explicitly denied and cart cleanup uses `ctx.user.id`.
- REQ-254-005: PARTIAL — no REN-172 implementation was duplicated, but the approved 51-procedure evidence is still unavailable.
- REQ-254-006: PASS — invite identity comes from Clerk; brand, expiry, use-limit, and atomic-use checks are enforced.
- REQ-254-007: PASS — return creation checks order ownership; admin mutations require refunds manage access and conditional statuses before effects.
- REQ-254-008: PASS — email and WhatsApp direct actions require authenticated role-derived site permissions.
- REQ-254-009: PARTIAL — release evidence is not available in this repository review.
- REQ-254-010: PASS — Clerk deletion updates the existing user row to deterministic anonymized identity values and preserves foreign-key history.

## Scenario Reconciliation

SCN-254-001, SCN-254-002, SCN-254-003, SCN-254-005, SCN-254-006, SCN-254-007, and SCN-254-008 are supported by the changed routes/actions and `src/security/ren-254-security-guards.test.ts`. SCN-254-004 remains PARTIAL because REN-172 evidence is not present. SCN-254-009 remains PARTIAL because staging snapshot, rollback, cache-flush, and monitoring evidence are release inputs rather than implementation artifacts.

## Invariant Reconciliation

INV-254-001 through INV-254-004 are supported by the target-brand checks, session-derived identities, conditional status updates, action guards, and anonymization. INV-254-005 is supported by the absence of REN-172 implementation changes, but final evidence linkage remains open.

## Flow and Architecture Review

FLOW-254-001 remains within existing Clerk, tRPC, finance-access, Redis-cache, and query boundaries. FLOW-254-002 uses in-place anonymization without deleting users. FLOW-254-003 is not yet closable because release evidence is external to this diff. No new schema or audit table was introduced.

## Security and Integration Review

SEC-254-001 and SEC-254-002 are implemented at role, confidential, return/replace, and direct server-action boundaries. SEC-254-003 is implemented before the changed destructive, provider, and state-transition effects. INT-254-001 is idempotent for repeated deletion events through deterministic update values and preserves the row. INT-254-002 uses existing permission middleware/guards before the affected external paths. Concurrency protection for invite uses is expressed as a conditional database update; a full transaction-backed concurrent acceptance test remains a staging/test follow-up.

## Scope and Drift Review

NO_DRIFT. Changes remain within the approved no-schema security checklist. The unresolved REN-172 and release evidence items are dependency/evidence gaps, not unauthorized implementation changes.

## Test Expectation Review

- TEXP-254-001: PASS — focused role/confidential contract coverage is present.
- TEXP-254-002: PASS — order deletion/cart identity and deletion anonymization contracts are present.
- TEXP-254-003: PARTIAL — invite and return/replace guards are statically covered; database-backed concurrency and state-race tests remain open.
- TEXP-254-004: PASS — direct email/WhatsApp action guards are covered.
- TEXP-254-005: PARTIAL — REN-172 is not duplicated, but its 51-procedure evidence is unavailable.
- TEXP-254-006: PARTIAL — implementation review cannot establish staging snapshot, rollback, cache flush, or monitoring evidence.

## Findings

### REV-001

- Severity: HIGH
- Category: dependency
- Description: REN-172 evidence for the approved 51-procedure cross-brand authorization implementation is still unavailable.
- Evidence: DEP-254-001 and TEXP-254-005 in `docs/.work-items/REN-254/work-item.yaml`; no REN-172 implementation or evidence is included in the diff.
- Impact: C1 cannot claim complete cross-brand authorization coverage or closure.
- Recommendation: Link the REN-172 implementation/PR and reconcile all 51 procedures before release approval.

### REV-002

- Severity: MEDIUM
- Category: test
- Description: Database-backed concurrent invite acceptance and return/replace side-effect race tests are not included.
- Evidence: TEXP-254-003; focused contract test is static in `src/security/ren-254-security-guards.test.ts`.
- Impact: Conditional guards are visible in code, but runtime race behavior still needs environment-backed evidence.
- Recommendation: Run staging-safe negative/concurrency tests without production data.

### REV-003

- Severity: MEDIUM
- Category: operability
- Description: Release safety evidence is not present in the implementation branch.
- Evidence: REQ-254-009, FLOW-254-003, and TEXP-254-006; no Neon snapshot, rollback target, Redis `user:*` flush record, or monitoring note is included.
- Impact: Deployment and rollback readiness cannot be confirmed from Git alone.
- Recommendation: Ayan records the release evidence and Akshay records the release decision before closure.

## Decisions Requiring Attention

None; the unresolved items are approved dependencies/evidence gates, not new policy decisions.

## Final Recommendation

Keep REN-254 open for REV-001 through REV-003. The code-level guard implementation can proceed to staging validation, but closure and release approval require REN-172 evidence plus the defined safety evidence package.
