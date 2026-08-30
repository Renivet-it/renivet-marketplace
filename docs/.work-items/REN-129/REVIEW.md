# REVIEW: REN-129 — Reassess the 5-second delayed PostHog init

## Executive Result

`REVIEW_PASSED_WITH_FINDINGS`; `NO_DRIFT`; base `origin/master` at `b9f0a8c17b691884cc78f9f6f10ebcd5eab82055`; head `0211b1b8` (full SHA recorded in `work-item.yaml`). Governance re-entry is not required. One verification action remains for the approved performance measurement expectation.

## Review Scope and Git Evidence

- Compared the approved REN-129 contract with the base-to-head repository diff.
- Implementation files: `src/components/providers/client.tsx`, `src/components/providers/posthog-init-policy.ts`, and `src/components/providers/client.test.ts`.
- The provider still uses the existing PostHog key/host, pageview, identify/reset, and session-recording configuration. The only runtime change is the approved delay value.
- Combined-branch REN-130–132 governance artifacts are present as expected; no unrelated application files were changed.

## Requirement Reconciliation

- `REQ-129-001`: PASS. `POSTHOG_INIT_DELAY_MS` is set to 1500 ms and is used by the provider timer.
- `REQ-129-002`: PASS. The diff preserves existing PostHog options and the existing timer cleanup, pageview, identify, and reset components.
- `REQ-129-003`: PARTIAL. A focused timing-bound test exists; mobile/short-session performance evidence is not represented in the repository diff.

## Scenario Reconciliation

- `SCN-129-001`: PASS through the policy constant test and provider use of the constant.
- `SCN-129-002`: PARTIAL because the shorter delay is implemented, but short-session capture/performance measurement is still required.
- `SCN-129-003`: PASS by unchanged cleanup and provider lifecycle code; the focused test avoids environment-loading side effects.

## Invariant Reconciliation

- `INV-129-001`: PASS. The existing single timer and cleanup lifecycle remain intact.
- `INV-129-002`: PASS. No session-recording or identity configuration changed.
- `INV-129-003`: PASS. No PostHog operation is made a prerequisite for rendering or authentication.

## Flow and Architecture Review

- `FLOW-129-001`: PASS. Provider mount still schedules one initialization timer and exposes the same PostHog provider; only the delay is centralized in a dependency-free policy module.
- `FLOW-129-002`: PASS. Unmount cleanup and route/identity consumers are unchanged.
- `DEP-129-001`: PASS. The installed PostHog browser SDK and environment configuration remain the same.

## Security and Integration Review

- `SEC-129-001`: PASS. No new identity, session-recording, or data collection configuration was introduced.
- `INT-129-001`: PARTIAL. The shorter timer reduces the blind window and preserves idempotency/lifecycle behavior, but real mobile/in-app-browser delivery and performance evidence still require measurement.

## Scope and Drift Review

`NO_DRIFT`. The implementation stays within the approved timing-only change. No event taxonomy, server capture, privacy setting, API, schema, dependency, or external provider contract changed.

## Test Expectation Review

- `TEXP-129-001`: PASS statically. `client.test.ts` verifies the selected delay remains within 1–2 seconds.
- `TEXP-129-002`: PARTIAL statically. Existing provider consumers remain unchanged, but no provider integration test was added for capture/identify/reset lifecycle.
- `TEXP-129-003`: PARTIAL. The repository contains no mobile/short-session performance measurement artifact.

## Findings

### REV-129-001

- Severity: MEDIUM
- Category: test
- Description: The approved mobile/short-session performance and capture comparison has not yet been recorded.
- Evidence: `REQ-129-003`, `SCN-129-002`, `TEXP-129-003`; implementation diff contains only the 1500 ms policy and unit-bound test.
- Impact: The chosen delay is implemented, but its PageSpeed and fast-exit trade-off remains empirically unverified.
- Recommendation: Run the approved performance/capture comparison on mobile-like and short-exit sessions after deployment and attach the results to the task.

## Decisions Requiring Attention

None. The owner-approved 1–2 second delay is implemented.

## Final Recommendation

Accept the implementation with the non-blocking action `REV-129-001`. No governance re-entry is required; complete the performance/capture measurement before declaring the operational verification fully closed.

