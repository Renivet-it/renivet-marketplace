# REN-129 Engineering Specification

## Decision and scope

REN-164 verified from the pinned `posthog-js` 1.215.6 source that
`capture()` returns before initialization and does not queue the call in this
integration. The current 1.5-second timer therefore still loses early events.

Recommended remediation: initialize PostHog immediately after the client
provider mounts with `disable_session_recording: true`, then call
`startSessionRecording()` after the existing 1.5-second performance window.
This preserves core event capture during the blind window while deferring the
more expensive replay work. The delay constant becomes the replay-start delay,
not the analytics initialization delay.

This contract does not claim a PageSpeed improvement without deployment
measurement. It requires staging and production performance/analytics
verification after implementation.

## Requirements

- `REQ-001`: PostHog initialization must not be delayed by the replay delay.
- `REQ-002`: Session recording must be disabled during immediate initialization.
- `REQ-003`: Session recording must start after the approved delay when the
  client remains mounted and the SDK is initialized.
- `REQ-004`: Early `$pageview`, autocapture, and funnel events must be eligible
  for capture immediately after provider mount.
- `REQ-005`: Existing event names, consent behavior, identity bridge, pageview
  behavior, and external-side-effect boundaries remain unchanged.
- `REQ-006`: Cleanup must cancel the delayed replay-start callback and avoid
  acting on an unmounted client.
- `REQ-007`: Staging and production verification must compare tracking coverage
  and PageSpeed before/after rollout.

## Scenarios

- `SCN-001`: Provider mount initializes PostHog immediately with replay disabled.
- `SCN-002`: A pageview captured before the replay delay is not lost because
  initialization has already completed.
- `SCN-003`: Replay starts after the configured delay for a still-mounted page.
- `SCN-004`: Provider unmount cancels delayed replay startup.
- `SCN-005`: Existing pageview, identify/reset, consent, and event contracts
  remain unchanged.
- `SCN-006`: A staging performance and network check verifies the trade-off
  without polluting production analytics.
- `SCN-007`: Production rollout confirms early-event coverage and PageSpeed
  remains within the accepted baseline.

## Invariants

- `INV-001`: `posthog.init()` is called once per provider mount.
- `INV-002`: Core capture is available before session recording starts.
- `INV-003`: Session recording is never enabled before the configured delay.
- `INV-004`: Cleanup prevents delayed callbacks after unmount.
- `INV-005`: No duplicate pageview is introduced by the initialization change.
- `INV-006`: No production data is emitted by automated tests.

## Flows

- `FLOW-001`: Mount → immediate init with replay disabled → core events capture.
- `FLOW-002`: Mount → delay callback → start session recording if still active.
- `FLOW-003`: Unmount → clear delayed callback → no replay startup.
- `FLOW-004`: Staging verification → controlled rollout → production metrics.

## Dependencies and boundaries

- `DEP-001`: `posthog-js` 1.215.6 `init` and `startSessionRecording` APIs.
- `DEP-002`: Renivet `ClientProvider`, `PostHogPageView`, and identify bridge.
- `DEP-003`: Existing `POSTHOG_INIT_DELAY_MS` policy, retained as replay delay.
- `DEP-004`: REN-164 source verification and evidence.
- `INT-001`: PostHog browser SDK initialization and session recording.
- `INT-002`: React effect lifecycle and cleanup.
- `INT-003`: Vercel staging/production deployment metrics.
- `SEC-001`: Tests must not send analytics events to production.

## Test expectations

- `TEXP-001` unit REQUIRED: immediate init includes `disable_session_recording: true`.
- `TEXP-002` unit REQUIRED: delayed callback invokes `startSessionRecording` once.
- `TEXP-003` regression REQUIRED: cleanup cancels replay startup after unmount.
- `TEXP-004` regression REQUIRED: pageview and identity bridge remain mounted
  with unchanged event behavior.
- `TEXP-005` integration REQUIRED: staging verifies early capture and replay
  timing through browser/network inspection.
- `TEXP-006` external_integration REQUIRED: production verifies event coverage,
  replay behavior, and PageSpeed against the baseline.

## Approval gate

This is an L3 contract because it changes a customer-facing analytics SDK
lifecycle and trades performance behavior against event completeness. The
recommended design requires explicit confirmation before implementation:
immediate initialization with replay disabled, followed by delayed replay
startup using the existing 1.5-second delay.
