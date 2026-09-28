# REVIEW: REN-208 — [FCCP][P1] Build Admin Contract Management & Brand Agreement Repository

## Executive Result

`REVIEW_PASSED_WITH_FINDINGS`. The implementation stays within the approved private UploadThing, additive Postgres, server-authorized tRPC, and audit-log design. Drift is `NO_DRIFT`; governance re-entry is not required. The comparison is the REN-208 implementation range from `faebb0bc59cb109b5926f2f28063a819f72768ea` through `7f2aba6b11bf3f12439d5a013c4995a519f8b866` on `feat/ren-203-spec`.

## Review Scope and Git Evidence

- Base branch: `origin/master`
- REN-208 contract/implementation base: `faebb0bc59cb109b5926f2f28063a819f72768ea`
- Head commit: `7f2aba6b11bf3f12439d5a013c4995a519f8b866`
- PR URL: `null`
- Changed implementation includes the additive migration, private UploadThing route, agreement queries, tRPC routes, admin/brand pages, validation/access tests, and static contract tests.
- The worktree also contains an untracked local test log under `tmp/`; it is not part of the implementation or review artifact.

## Requirement Reconciliation

- `REQ-208-001`, `REQ-208-002`, `REQ-208-003`, `REQ-208-004`, `REQ-208-005`, `REQ-208-006`, `REQ-208-007`, `REQ-208-008`, `REQ-208-010`, and `REQ-208-011`: PASS. Evidence: `brand_agreements` schema/migration, `brandAgreementQueries`, `brandAgreementsRouter`, private `brandAgreementUploader`, and cleanup in `src/lib/trpc/routes/general/brand-agreements.ts`.
- `REQ-208-009`: PASS. Evidence: `AgreementRows` renders `Not on file` for an empty repository.
- `REQ-208-004` write restriction: PASS. Brand access exposes `listMine` and signed downloads only; mutations are `adminProcedure` routes.

## Scenario Reconciliation

- `SCN-208-001`, `SCN-208-002`, `SCN-208-003`, `SCN-208-004`, `SCN-208-005`, `SCN-208-007`, `SCN-208-008`, and `SCN-208-009`: PASS by static implementation evidence and focused unit/static tests.
- `SCN-208-006`: PARTIAL. The server authorization and private provider key flow are present, but a runtime direct-provider/IDOR integration test is not included in this diff.

## Invariant Reconciliation

- `INV-208-001`, `INV-208-002`, `INV-208-003`, `INV-208-004`, `INV-208-005`, `INV-208-006`, and `INV-208-007`: PASS by schema constraints, append-only version allocation, persisted-brand authorization, private ACL, signed URL issuance, audit calls, and untouched existing brand fields.

## Flow and Architecture Review

- `FLOW-208-001` through `FLOW-208-004`: PASS. UploadThing returns only a private key; Postgres stores metadata and the key; version creation is transactional with bounded retry; failed creation/audit cleanup removes the new row and provider object.
- `DEP-208-001` through `DEP-208-005`: PASS. The implementation uses existing brands, auth middleware, audit helper, and a dedicated additive table without commercial-term extraction.

## Security and Integration Review

- `SEC-208-001`: PASS. Admin and brand read/download routes authenticate server-side; persisted agreement brand ownership is checked before signed URL generation.
- `SEC-208-002`: PASS. The dedicated uploader uses `acl: "private"`; only a five-minute signed URL is returned after authorization.
- `SEC-208-003`: PASS. Audit metadata excludes file contents, provider secrets, and signed URLs.
- `INT-208-001` and `INT-208-002`: PARTIAL. Failure cleanup and audit calls are implemented, but provider outage and cross-tenant behavior are not exercised by runtime integration tests in this diff.

## Scope and Drift Review

`NO_DRIFT`. Changes are limited to the approved repository, private file delivery, additive schema, authorization, audit, UI, and tests. Existing brand contract timestamps, terms acceptance, and commercial values are not modified.

## Test Expectation Review

- `TEXP-208-001`: PASS — metadata/date/version/file validation tests.
- `TEXP-208-002`: PASS — additive migration, FK, uniqueness, and query implementation evidence.
- `TEXP-208-003`, `TEXP-208-004`, `TEXP-208-005`, and `TEXP-208-006`: PARTIAL — implementation paths exist, but required full lifecycle, role-matrix/IDOR, audit integration, and provider/database failure tests are not present as runtime integration tests.
- `TEXP-208-007`: PASS by additive-only diff and focused regression assertions.

## Findings

### REV-001

- Severity: MEDIUM
- Category: test
- Description: Required runtime integration coverage for the full lifecycle, IDOR matrix, direct provider access, audit persistence, and provider/database failure paths is not included.
- Evidence: `TEXP-208-003` through `TEXP-208-006`; current tests are `tests/ren-208-brand-agreements.test.ts`, `src/lib/brand-agreements/access.test.ts`, and `src/lib/brand-agreements/validation.test.ts`.
- Impact: Authorization and recovery behavior is statically evidenced but not proven against the running database, tRPC context, and UploadThing provider.
- Recommendation: Add the approved integration/security matrix before production rollout.

## Decisions Requiring Attention

None. The private UploadThing ACL and five-minute signed URL decision is already approved in `DEC-208-001`.

## Final Recommendation

Accept the implementation for code review with `REV-001` tracked as the remaining verification action. Before production rollout, run the runtime lifecycle and authorization matrix, including direct provider-key access and failure cleanup. The UploadThing dashboard must keep per-request ACL overrides enabled; existing public upload routes remain unchanged.
