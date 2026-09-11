# REVIEW: REN-125 — Build OWASP ASVS L2 control matrix with evidence

## Executive Result

`REVIEW_PASSED_WITH_FINDINGS`; `NO_DRIFT`; governance re-entry is not required. Compared `origin/master` commit `d43477e239f22aa0fafc23038667ee12641e61d3` with implementation commit `3e0c144f0a312146c9d5b0cf281e592a678821df`.

## Review Scope and Git Evidence

The branch contains only REN-125 governance artifacts and `docs/security/ASVS-L2-CONTROL-MATRIX.md`. The matrix is pinned to OWASP ASVS 5.0.0 and contains all 253 requirements whose verification level is L1 or L2. The completeness check reported `Expected=253 Actual=253 Unique=253 Missing=0 Extra=0`.

## Requirement Reconciliation

- `REQ-125-001`–`REQ-125-005`: PASS. Every applicable official ASVS 5.0.0 L1/L2 identifier appears exactly once, has one status, and includes repository evidence or a documented evidence gap. The document clearly limits itself to engineering evidence and contains no credentials or customer data.

## Scenario Reconciliation

- `SCN-125-001`–`SCN-125-004`: PASS. Complete-source comparison, conservative status assignment, scope language, path checks, and sensitive-data review are represented.

## Invariant Reconciliation

- `INV-125-001`–`INV-125-004`: PASS. No missing evidence is inferred as Pass; the matrix makes no certification claim and preserves unresolved controls as `Needs-review` or `Fail`.

## Flow and Architecture Review

`FLOW-125-001` is PASS. The deliverable follows the approved source-to-evidence workflow and introduces no runtime, schema, migration, configuration, or public-interface change.

## Security and Integration Review

`SEC-125-001` and `BR-125-001` are PASS for the documentation task. The assessment identifies two concrete engineering failures: `V5.2.1` because the UploadThing limit permits 9,999 files and 1024 GB, and `V12.3.1` because two catalog-search URLs use unencrypted HTTP. These findings mean Renivet must not be described as ASVS Level 2 compliant.

## Scope and Drift Review

`NO_DRIFT`. All changed paths are within the approved documentation/governance scope.

## Test Expectation Review

- `TEXP-125-001`: PASS — 253 expected, 253 present, 253 unique, zero missing, zero extra.
- `TEXP-125-002`: PASS — status semantics and engineering-only limitations are explicit.
- `TEXP-125-003`: PASS — cited paths were reviewed and no sensitive values are included.

## Findings

### REV-125-001

- Severity: HIGH
- Category: security
- Description: Two ASVS requirements are confirmed `Fail`: excessive upload limits (`V5.2.1`) and unencrypted catalog-search transport (`V12.3.1`).
- Impact: The application cannot currently claim ASVS Level 2 conformance.
- Recommendation: Remediate both code findings and retest before changing their statuses.

### REV-125-002

- Severity: MEDIUM
- Category: evidence
- Description: 251 requirements remain `Needs-review` because sufficient implementation, configuration, runtime, or organizational evidence has not yet been collected.
- Impact: The matrix is a complete assessment backlog, not a completed certification.
- Recommendation: Work through the evidence requests and update each status only with reproducible proof.

## Decisions Requiring Attention

None for delivery of REN-125. Security owners must prioritize the two confirmed failures and assign evidence owners for the remaining controls.

## Final Recommendation

Deliver REN-125 as the complete ASVS 5.0.0 Level 2 engineering control matrix. Do not represent Renivet as passing ASVS Level 2 until the two failures are fixed and the 251 `Needs-review` controls have sufficient evidence.
