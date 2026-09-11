# REVIEW: REN-156 — Remove dead ai-suggestion.ts client; reduce redundant calls to the external RAG endpoint per search action

## Executive Result

`REVIEW_PASSED_WITH_FINDINGS` with `NO_DRIFT`. The implementation removes only the confirmed-dead module and adds the task-local governance artifacts. No governance re-entry is required. The comparison is `origin/master` commit `3faa6b20d0452387db0b48a213479e054f6e276b` to implementation commit `5e7cb931a199cd898f4d5b3e27451d837eb69657`.

## Review Scope and Git Evidence

- Base branch: `origin/master`; merge base: `3faa6b20d0452387db0b48a213479e054f6e276b`.
- Head commit: `5e7cb931a199cd898f4d5b3e27451d837eb69657`.
- Changed files: `src/lib/python/ai-suggestion.ts` deleted; `docs/.work-items/REN-156/SPEC.md` and `work-item.yaml` added.
- The deletion removes the two unreferenced exports identified in the approved contract. No active route or ML/RAG consumer is changed.

## Requirement Reconciliation

- `REQ-156-001`: PASS — repository source reference audit found no active references to the module or either export before deletion, and none remain after deletion.
- `REQ-156-002`: PASS — the target file is deleted in the base-to-head diff.
- `REQ-156-003`: PASS — the live search-suggestions route and other active consumers are absent from the diff and remain unchanged.
- `REQ-156-004`: PARTIAL — governance validation passed and the full test command was run, but TypeScript checking did not complete within the execution window.

## Scenario Reconciliation

- `SCN-156-001`: PASS — source reference audit reports no active references.
- `SCN-156-002`: PASS — the target module is absent and no replacement was added.
- `SCN-156-003`: PASS — active consumer files are unchanged in the comparison diff.
- `SCN-156-004`: PARTIAL — verification evidence is available, but the TypeScript command timed out.

## Invariant Reconciliation

- `INV-156-001`: PASS — no active consumer reference exists.
- `INV-156-002`: PASS — no live ML/RAG request or response code changed.
- `INV-156-003`: PARTIAL — static diff has no module-resolution issue, but complete TypeScript execution was unavailable.

## Flow and Architecture Review

- `FLOW-156-001`: PASS for the approved deletion flow: the dead module is removed without changing the active search architecture.
- Dependency and integration boundaries remain unchanged. The deletion does not alter request payloads, responses, timeouts, fallbacks, or endpoint configuration.

## Security and Integration Review

No authentication, authorization, tenant isolation, PII, payment, database, or security-boundary code changed. The external ML integration is unchanged; this task removes an unused client only.

## Scope and Drift Review

`NO_DRIFT`. The diff is within `REQ-156-002` and the approved deletion-only scope. REN-146 timeout/configuration work and live RAG-call consolidation were not included.

## Test Expectation Review

- `TEXP-156-001`: PASS — source reference audit was performed and the removed file is absent.
- `TEXP-156-002`: PARTIAL — repository tests ran, but the suite retained unrelated existing failures and TypeScript checking timed out.
- `TEXP-156-003`: NOT_APPLICABLE as a behavior test — the contract explicitly requires no new unit test for a caller-less removed module.

Separate verification evidence: the full Bun suite reported 259 passing, 1 skipped, and 3 failures. The failures were the pre-existing festive cart/pill assertions and the missing `@react-pdf/image` artifact; none references REN-156. Governance validation passed. A `bunx tsc --noEmit` run did not finish within the execution window.

## Findings

### REV-156-001

- Severity: LOW
- Category: test
- Description: TypeScript verification did not complete within the available execution window, so the build/typecheck acceptance evidence is incomplete.
- Evidence: `REQ-156-004`, `SCN-156-004`, `INV-156-003`, `TEXP-156-002`; `bunx tsc --noEmit` timed out in the REN-156 worktree.
- Impact: A missed module-resolution issue would be detected later by CI or a completed local typecheck.
- Recommendation: Rerun the TypeScript check in CI or a longer local session before merge.

## Decisions Requiring Attention

None.

## Final Recommendation

Approve the scoped deletion for merge with the low-severity verification follow-up above. No governance re-entry is required; rerun TypeScript verification before production release.

