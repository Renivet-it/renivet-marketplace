# REN-208 Independent Critic Review

Review mode: fresh-context, read-only repository review.

## Findings

- **CRIT-208-001 — DESIGN_BLOCKER, resolved:** The existing UploadThing integration returns `file.url` values from `src/app/api/uploadthing/core.ts`. REN-208 requires private, non-guessable, authorization-checked agreement delivery. Resolved by the approved private UploadThing ACL and signed-URL design; agreements must not use public UploadThing URLs. References: REQ-208-006, SCN-208-006, INV-208-005, DEC-208-001.
- **CRIT-208-002 — MAJOR:** Brand routes commonly use a caller-supplied `brandId` and permission middleware; the agreement read/download path must load the agreement first and authorize against its persisted brand relation. References: REQ-208-005, SCN-208-005, INV-208-003/004.
- **CRIT-208-003 — MAJOR:** A storage upload followed by a database failure can leave orphaned sensitive files. The implementation contract needs an explicit cleanup or recoverable-pending strategy and failure tests. References: REQ-208-011, SCN-208-008, FLOW-208-004.
- **CRIT-208-004 — MINOR:** The existing generic audit attachment field must not become the agreement repository. Agreement version metadata and private object references need dedicated schema fields, while audit entries should contain only safe identifiers and metadata. References: REQ-208-007/008, INV-208-006.
- **CRIT-208-005 — MINOR:** Existing brand contract timestamps and `has_accepted_terms` have different meanings and are unreliable as agreement evidence. The implementation must not backfill or use them for authorization. References: REQ-208-009/010, INV-208-007.

## Category coverage

- Requirements/scenarios: covered, including absence, replacement, failure, and access-denial cases.
- Failure/recovery: covered through object/database ordering and orphan cleanup.
- Security/privacy: covered; private storage remains a design blocker.
- State/data consistency: covered through append-only versions, brand FK, and unique version sequencing.
- Integration/idempotency: covered through upload completion, duplicate version race, and retry tests.
- Compatibility/migration: additive-only table; existing brand fields remain untouched.
- Observability/testability: append-only audit and explicit authorization/security matrix required.
- Assumptions/dependencies: storage provider and signed-delivery capability are explicitly unresolved.

## Recommendation

`READY_FOR_DEV` after the user approved private UploadThing storage. Do not implement a public-link or URL-proxy workaround; issue signed URLs only after authorized server checks.
