# Implementation reconciliation

## Evidence standard

Assess the approved contract against the actual comparison diff and the minimum surrounding code needed to understand it. Every conclusion must cite at least one contract ID and concrete Git/repository evidence. Distinguish observations from inferences. Missing or inaccessible evidence cannot support `PASS`.

Use evidence such as:

- exact base/head commits, PR metadata, diff paths, hunks, and symbols
- requirement, scenario, invariant, flow, security, integration, decision, and test-expectation IDs
- callers, consumers, state transitions, error paths, authorization checks, and existing test files

Do not infer test execution from test code or CI configuration. REVIEW inspects tests; it does not run them.

## Assessment values

| Value            | Meaning                                                                                                                  |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `PASS`           | Direct evidence shows every applicable item in the category is implemented consistently with the approved contract.      |
| `PARTIAL`        | Some items are supported, but evidence or coverage is incomplete and no observed contradiction is being hidden.          |
| `FAIL`           | Direct evidence shows an applicable contract item is missing, contradicted, or implemented outside an approved boundary. |
| `NOT_APPLICABLE` | Contract and repository evidence show that the category does not apply; record the reason.                               |

Aggregate a category as `FAIL` if any item fails; otherwise `PARTIAL` if any item is partial; otherwise `PASS` when at least one applicable item passes; otherwise `NOT_APPLICABLE`. Never average away a failure.

## Required coverage

| Area                  | Reconcile                                                                                                                                                                                                                                                                                        |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Requirements          | Each `REQ-*`, including explicit outcome, constraints, and acceptance evidence.                                                                                                                                                                                                                  |
| Scenarios             | Each `SCN-*`, including happy, alternate, negative, authorization, identity, retry, concurrency, external-failure, recovery, and regression paths when specified.                                                                                                                                |
| Invariants            | Each applicable `INV-*` across all changed paths and state transitions.                                                                                                                                                                                                                          |
| Flow and architecture | `FLOW-*`, approved component boundaries, data/control flow, public interfaces, dependencies, compatibility, and failure handling.                                                                                                                                                                |
| Security              | `SEC-*`, authentication, authorization, tenant isolation, privacy, validation, secret handling, and trust boundaries.                                                                                                                                                                            |
| Integrations          | `INT-*`/`DEP-*`, request and response contracts, retries, idempotency, timeouts, error behavior, and fallback/recovery. Record integration conclusions in REVIEW.md and roll them into YAML `architecture` and, where relevant, `security`; the normalized YAML has no separate integration key. |
| Scope                 | Approved inclusions/exclusions versus every changed file, dependency, API, schema, externally visible behavior, and unrelated modification.                                                                                                                                                      |
| Test expectations     | Each `TEXP-*` classification and expected layer against changed or existing tests. Assess static coverage only; do not execute tests or claim runtime results.                                                                                                                                   |

## Drift

| Classification   | Rule                                                                                                                                                                                                                                                                                               |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NO_DRIFT`       | The implementation stays within approved requirements, behavior, architecture, interfaces, security/integration boundaries, and scope. Compatible implementation details within explicit design freedom are not drift.                                                                             |
| `MINOR_DRIFT`    | A reversible, behaviorally compatible variation does not change an approved contract, invariant, public interface, architecture, security boundary, integration contract, or required test outcome. Record a non-blocking finding.                                                                 |
| `MATERIAL_DRIFT` | The implementation adds, removes, or changes approved behavior, requirements, scenarios, invariants, state flow, architecture, API/data contract, dependency, security/privacy boundary, integration semantics, destructive behavior, or required test strategy. Governance re-entry is mandatory. |

Material drift requires `governance_reentry_required: true`, a non-ready task status, and `REVIEW_FAILED`; never edit the approved SPEC to erase the difference.

## Decisions

First verify implementations against decisions already approved in the contract. For a newly exposed or unresolved decision:

- **Class A — `AUTO_DECIDE`:** record the evidence and recommended convention-supported disposition. If the implementation stays within approved design freedom, it may remain `NO_DRIFT`; otherwise record at least `MINOR_DRIFT`. Do not rewrite the approved contract.
- **Class B — `RECOMMEND_CONTINUE`:** record it under Decisions Requiring Attention with basis, confidence, consequence, and recommendation. A compatible, non-blocking case may be `REVIEW_PASSED_WITH_FINDINGS`; a contract contradiction fails.
- **Class C — `HUMAN_CONFIRMATION`:** do not decide it. Create a blocking finding and required action, classify `MATERIAL_DRIFT`, set governance re-entry, move the local work item to `BLOCKED`, and return `REVIEW_FAILED`.

High confidence never reduces a high-consequence decision class.

## Result selection

| Result                        | Use when                                                                                                                                                                                              |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `REVIEW_PASSED`               | All applicable categories pass, others have evidenced non-applicability, drift is `NO_DRIFT`, and findings/actions/blockers are empty.                                                                |
| `REVIEW_PASSED_WITH_FINDINGS` | Review is complete with only non-blocking findings, `PARTIAL` coverage, or `MINOR_DRIFT`; no material drift or unresolved Class C decision exists.                                                    |
| `REVIEW_FAILED`               | Evidence shows a failed contract item, blocking finding, or material drift.                                                                                                                           |
| `REVIEW_BLOCKED`              | The approved contract exists, but the diff base, implementation evidence, or another required review input cannot be established. Use null commits and record the blocker without inventing evidence. |

`SPEC_CONTRACT_MISSING` is a pre-review stop, not a review result.

Completed results (`REVIEW_PASSED`, `REVIEW_PASSED_WITH_FINDINGS`, and `REVIEW_FAILED`) require exact SHA40 base/head commits. A blocked review instead requires both commits to be `null`, at least one `PARTIAL` reconciliation value and no `FAIL`, at least one blocking finding or required action, and evidence beginning `Comparison input unavailable:`. Material drift is never blocked: it requires `REVIEW_FAILED`, governance re-entry, and a non-ready task state. Every non-material result keeps governance re-entry false.
