# REN-121 Engineering Specification

## Objective

Provide ten repeatable, guest-only agent-browser journeys that run against local or explicitly allowlisted staging origins. Journeys are read-only and stop at login walls; no payment or form submission is automated.

## Requirements

- REQ-001: Define exactly ten documented guest journeys and executable route definitions.
- REQ-002: Run journeys through Bun and agent-browser with deterministic page/login-wall classification.
- REQ-003: Reject production and unknown origins before navigation.
- REQ-004: Never submit forms, mutate cart state, or invoke Razorpay/payment actions.
- REQ-005: Add a `test:e2e` package command and operator runbook.

## Design

`tests/JOURNEYS.md` documents the journey intent. `scripts/e2e/guest-journeys.ts` owns the typed manifest, target safety validation, browser command seam, classification, cleanup, and CLI entry point. `tests/e2e/guest-journeys.test.ts` covers manifest completeness and safety behavior. The runner accepts `E2E_BASE_URL`; non-loopback targets must also appear in `E2E_ALLOWED_ORIGINS`. Production origins are always blocked.

## Scope boundaries

The suite does not log in, create accounts, submit forms, add products, begin payment, or call Razorpay. Live staging execution requires an operator-provided staging URL and is not performed by CI or this implementation pass.

## Test expectations

- TEXP-001 (unit): ten journeys, read-only flags, and login-wall IDs are deterministic.
- TEXP-002 (security): production and unknown origins are blocked; loopback and exact allowlisted origins are accepted.
- TEXP-003 (integration/e2e): the CLI opens each route, waits for network idle, classifies the page, and closes the browser in a `finally` block.

## Risk

L2: this adds an external browser integration and must be fail-closed around target origin and payment boundaries, but it does not change application behavior or data.
