# REN-285 — Independent Critic review

## Review posture

Fresh-context, read-only review of Linear REN-285, the task specification and
machine-readable contract, and the banner migration, query, tRPC mutations,
cache, upload form, and homepage banner loading. No source, test, Linear, or
production data was changed by the Critic.

## Findings and resolution

- `CRIT-285-001` — MAJOR — Update and delete could leave database/media state
  inconsistent because the old image was deleted before the database update,
  and delete ran external and database operations concurrently. Resolved by
  `REQ-285-009`, `SCN-285-009`, `INV-285-006`, and `TEXP-285-007`: the database
  remains authoritative, cleanup is ordered after persistence/cache work, and
  create/update persistence failures attempt to remove the new upload. Failed
  cleanup is logged with a stable key for manual orphan cleanup.
- `CRIT-285-002` — MAJOR — A mobile banner query failure prevented the shared
  homepage banner component from rendering desktop banners. Resolved by
  `REQ-285-010`, `SCN-285-010`, `INV-285-006`, and `TEXP-285-007`: log the
  failure, omit mobile slides for the request, and retain desktop cached
  banners.
- `CRIT-285-003` — MINOR — Scenario traceability did not explicitly cover a
  failed create after upload. Resolved by updating `SCN-285-009` to cover
  create and update persistence failures and connecting both to the fault
  injection expectation.

## Required category coverage

- Requirements and scenarios: reviewed; failure cases are explicit and traced.
- Failure recovery: reviewed; partial DB/media outcomes have defined behavior.
- Security and privacy: reviewed; existing `MANAGE_CONTENT` authorization is
  retained and no new trust boundary is introduced.
- State/data consistency: reviewed; database row remains authoritative.
- Integrations/idempotency: reviewed; upload cleanup and post-commit orphan
  handling are defined.
- Compatibility/migration: reviewed; desktop default and migration-before-app
  deployment are specified.
- Observability/testability: reviewed; query and cleanup failures have logs and
  fault-injection expectations.
- Assumptions/dependencies: reviewed; UploadThing limits and cleanup behavior
  are recorded in the contract.

No unresolved design blockers remain.
