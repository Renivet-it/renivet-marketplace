# REN-212 Independent Critic Review

Reviewer: independent fresh-context critic
Mode: read-only
Result: `BLOCKED` pending contract corrections and finance-owner decisions

## Findings

- **CRIT-212-005 — BLOCKER — OPEN:** The ticket requires factual read-only production credential status and live/vestigial COD-family identification. The first draft excluded production reads too broadly. The corrected contract allows read-only configuration metadata and production usage/overlap reports while still forbidding writes and carrier sync execution.
- **CRIT-212-006 — MAJOR — OPEN:** Missing configuration returns `[]`, while provider failure throws after a run may have seeded rows. The contract must require separate `not_checked`, `provider_failed`, and `checked` evidence and partial-carrier failure/retry reporting.
- **CRIT-212-007 — MAJOR — OPEN:** The report needs a redaction contract for carrier payloads, payment IDs, remittance references, and authorization. Only non-secret hashes/last-four identifiers and aggregate counts may be exposed outside finance authorization.
- **CRIT-212-008 — MAJOR — OPEN:** The contract must require null/state preservation: absent provider evidence stays unavailable/null in the finance family, and the legacy default-zero family must not be interpreted as confirmed remittance.
- **CRIT-212-009 — MAJOR — OPEN:** The later implementation needs explicit row identity/deduplication for repeated carrier rows, AWB/order matching, ghost rows, and shared Razorpay payment groups.
- **CRIT-212-010 — MAJOR — OPEN:** The later table-family decision must include compatibility evidence for legacy monitoring consumers and newer finance consumers before any migration or consolidation.
- **CRIT-212-011 — MAJOR — OPEN:** Discovery output needs a defined evidence artifact/report shape proving “not checked” versus “checked and zero,” plus an audit/metric/alert requirement.
- **CRIT-212-012 — MAJOR — OPEN:** The two unresolved Class-C decisions are correctly blockers. The BIZ-11 dependency remains upstream/deferred; REN-204 is an integration dependency, not a decision that this ticket resolves.

## Adequately bounded

- **CRIT-212-013 — MINOR — RESOLVED:** Discovery-only scope is explicit.
- **CRIT-212-014 — MINOR — RESOLVED:** Unconfirmed COD/split payments remain held and never become paid as the interim safe default.
- **CRIT-212-015 — MINOR — RESOLVED:** Shared Razorpay payment IDs are treated as payment groups, not order-level proof.

## Gate

The contract remains `BLOCKED` until the corrected evidence/report requirements are accepted and finance/operations confirms the permanent-hold duration/escalation owner and the canonical COD table family after read-only production evidence.
