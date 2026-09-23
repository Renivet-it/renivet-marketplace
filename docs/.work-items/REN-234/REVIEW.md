# REVIEW: REN-234 — [FCCP][P1] Commission Rules Admin Management UI

## Executive Result

Result: `REVIEW_PASSED_WITH_FINDINGS`. Drift: `NO_DRIFT`. The implementation stays on the approved feature branch and uses the existing finance, tRPC, DataTable, permission, resolver, and audit boundaries. Governance re-entry is not required.

## Review Scope and Git Evidence

- Base branch: `origin/master`
- Base commit: `08d89fbc2a3f23c48b16c6ec1ab8fecc559d6fe3`
- Head commit: `1eb46a7295417a84fe5051786db03667c09ce00b`
- PR URL: `null`
- Worktree has only the existing untracked `tmp/` files outside the REN-234 change set.
- Changed implementation includes the finance dashboard link/page, read-only admin query surfaces, pure overlap preview helpers/tests, and the protected workspace/form/history/deactivation UI.

## Requirement Reconciliation

- `REQ-234-001`: PASS — `commission-rules-workspace.tsx` uses the shared `DataTable`, displays rule scope/rate/priority/specificity/effective dates/status, and provides loading/error retry and status/brand/category/search controls.
- `REQ-234-002`: PASS — the form mirrors the existing mutation fields, validates required values, makes basis-point percentage guidance explicit, and omits editable holdback.
- `REQ-234-003`: PASS — `previewCommissionRule` calls `analyzeCommissionRulePreview`, which uses the exported resolver and overlap helpers; exact overlap blocks while different-scope overlap is informational.
- `REQ-234-004`: PASS — deactivation is a separate confirmation flow that upserts `isActive: false`; inactive rows remain queryable.
- `REQ-234-005`: PASS — history reads existing finance audit rows and renders only returned actor/action/timestamp/before/after values.
- `REQ-234-006`: PASS — the page uses `assertFinanceModulePageAccess("payouts")`; view users receive no create/edit/deactivate controls, and server mutations remain admin-protected.
- `REQ-234-007`: PASS — no migration, rate insertion, holdback override, or payout resolver redesign was added.

## Scenario Reconciliation

- `SCN-234-001`, `SCN-234-002`, `SCN-234-003`, `SCN-234-004`, `SCN-234-005`, `SCN-234-006`, `SCN-234-007`, `SCN-234-008`: PASS by static evidence in the page boundary, workspace controls, route authorization, preview helper, and focused tests.

## Invariant Reconciliation

- `INV-234-001`: PASS — server access checks remain authoritative and mutation controls are omitted for view-only users.
- `INV-234-002`: PASS — the client displays the server preview; precedence is delegated to `resolveCommissionRuleFromCandidates`.
- `INV-234-003`: PASS — exact overlap yields `kind: "conflict"` and disables Save.
- `INV-234-004`: PASS — the deactivation path sends `isActive: false` and never deletes.
- `INV-234-005`: PASS — both create/edit/deactivate payloads send `holdbackPercentBps: 0`.

## Flow and Architecture Review

- `FLOW-234-001`: PASS — finance access leads to the new page, DataTable filters/sorting, history, and inactive visibility.
- `FLOW-234-002`: PASS — required validation precedes preview, preview precedes Save, mutation errors preserve form state, and success invalidates the table query.
- `FLOW-234-003`: PASS — confirmation precedes soft deactivation and the row remains inspectable.
- `DEP-234-001`, `DEP-234-002`, `DEP-234-003`, `INT-234-001`, `INT-234-002`: PASS — existing schema/backend/access/audit integrations are reused without schema changes.

## Security and Integration Review

- `SEC-234-001`: PASS — page and server procedures enforce finance access; client visibility is not relied upon as authorization.
- `SEC-234-002`: PASS — no public route or public data exposure was added.
- Query failure is visible and retryable; Save is disabled while preview is pending or failed. The mutation keeps entered values after failure.

## Scope and Drift Review

`NO_DRIFT`: all changed files are within the approved UI/query/test scope. No new dependency, schema, migration, commission rate, or payout calculation behavior was introduced.

## Test Expectation Review

- `TEXP-234-001`: PASS — focused unit coverage exists for overlap classification, inclusive dates, resolver precedence, fallback-none behavior, and form/bps contract.
- `TEXP-234-002`: PARTIAL — route authorization and existing REN-209 regression coverage are present, but no new isolated tRPC integration test was added for every new query surface.
- `TEXP-234-003`: PARTIAL — form contract tests exist, but a browser/DOM component test for the full workspace state matrix is not present.
- `TEXP-234-004`: PASS — existing resolver/commission tests pass and the diff contains no schema or rate changes.

## Findings

### REV-001

- Severity: LOW
- Category: test
- Description: The new query surfaces and full workspace rendering do not yet have dedicated API/DOM integration tests.
- Evidence: `TEXP-234-002` and `TEXP-234-003`; implementation tests currently cover `commission-rule-form.ts` and `commission-rule-admin.ts` directly.
- Impact: Future permission or UI-state regressions may be detected later than desired.
- Recommendation: Add route-level authorization tests and a DOM test for view-only/manage/error/deactivation/history states.

## Decisions Requiring Attention

None.

## Final Recommendation

Accept the implementation with the non-blocking test-coverage finding `REV-001`. Run the focused REN-234 tests and governance validator before handoff. The repository-wide test command still has unrelated existing failures in REN-191, H1 ownership, and PostHog initialization; those are not caused by the REN-234 diff.
