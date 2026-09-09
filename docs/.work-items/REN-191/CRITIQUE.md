# CRITIQUE: REN-191

## Result

Independent fresh-context read-only review completed. The draft remains `BLOCKED` pending two owner decisions.

## Findings and disposition

- `CRIT-191-001` — DESIGN_BLOCKER: Exact MIME keys, size/count limits, mixed-request behavior, and validation boundary were incomplete. Resolved in the design with an exact MIME allowlist, per-key request bounds, explicit provider-validation boundary, and owner approval gate (`DEC-191-001`).
- `CRIT-191-002` — DESIGN_BLOCKER: No deployable HTTPS endpoint was established. Preserved as unresolved dependency and owner decision (`DEP-191-002`, `DEC-191-002`).
- `CRIT-191-003` — DESIGN_BLOCKER: Timeout contract was undefined. Resolved as five seconds, no retry, deterministic fallback, and explicit tests.
- `CRIT-191-004` — MAJOR: SSRF/redirect boundary was incomplete. Resolved with origin-only validation, credential/path/query/fragment rejection, environment-aware loopback rules, and redirects disabled. Private HTTPS remains permitted because the value is trusted operator configuration and private networking may be intentional.
- `CRIT-191-005` — MAJOR: Environment classification was ambiguous. Resolved using `APP_ENV` as deployment stage and `NODE_ENV` as the local/test guard.
- `CRIT-191-006` — MAJOR: Consumer inventory omitted active paths. Resolved by enumerating all six calls across five files, including product-write embeddings.
- `CRIT-191-007` — MAJOR: Fallback behavior conflicted across callers. Resolved by preserving each existing public contract rather than forcing one shared return shape.
- `CRIT-191-008` — MAJOR: Existing logs could expose queries, URLs, Axios configuration, and upstream bodies. Resolved by requiring local generic errors and structured reason-only telemetry.
- `CRIT-191-009` — MAJOR: Retry, redirect, and response validation were unspecified. Resolved with zero retries, redirects disabled, five-second timeout, expected-shape validation, and safe fallback.
- `CRIT-191-010` — MINOR: Upload/provider-to-database orphan consistency is pre-existing. Recorded as an explicit exclusion because this task does not alter persistence sequencing.
- `CRIT-191-011` — MINOR: Existing media compatibility data is unavailable. Preserved through explicit owner acceptance of the proposed behavior change.
- `CRIT-191-012` — MINOR: Deployment observability was underspecified. Resolved with sanitized reason codes and Preview/Production smoke checks.

## Category coverage

Requirements/scenarios, failure/recovery, security/privacy, state/data consistency, integrations/idempotency, compatibility/migration, observability/testability, and assumptions/dependencies were reviewed. No files were edited by the Critic.
