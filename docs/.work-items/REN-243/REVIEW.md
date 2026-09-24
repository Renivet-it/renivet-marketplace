# REVIEW: REN-243 — Fix bulk HSN updates and add audited admin HSN import

## Executive Result

`REVIEW_PASSED_WITH_FINDINGS` with `MINOR_DRIFT`. The implementation stays within the approved HSN import scope and preserves duplicate rejection. Governance re-entry is not required. The only non-blocking finding is that the new UI has static/source coverage but no dedicated rendered component test.

Base: `origin/master` at `f50896cbe52656c596648b13dfeb5db4cb2126f2`  
Head: `029cad5e4608978af92e0b5ca9268001725969c7`

## Review Scope and Git Evidence

- Branch: `feat/hsn-bulk-upload-fix`.
- Linear identity: `REN-243`, matching the task-local work-item directory and contract.
- Changed implementation areas: existing general and brand bulk product routes, finance router, protected finance settings page, HSN import workspace, HSN normalization/resolution helper, and focused tests.
- No schema, migration, dependency, production configuration, or production data changes.

## Requirement Reconciliation

- `REQ-243-1`: PASS. General and brand bulk routes now persist `hsCode` when updating existing variants.
- `REQ-243-2`: PASS. The settings workflow accepts CSV/XLSX, normalizes HSN aliases, previews through an admin-only procedure, and does not write during preview.
- `REQ-243-3`: PASS. The workflow resolves existing product/variant rows only; collisions are ambiguous and no records are created.
- `REQ-243-4`: PASS. Client batches are bounded at 500, progress is shown, preview tokens bind writes to the reviewed payload, and results include updated, unchanged, unmatched, ambiguous, skipped, and failed outcomes.
- `REQ-243-5`: PASS. Server procedures use `adminProcedure`; malformed HSN values and duplicate SKUs are rejected.

## Scenario Reconciliation

- `SCN-243-1`: PASS through the general and brand bulk-import regression tests.
- `SCN-243-2`: PASS through normalization and server preview with no-write behavior.
- `SCN-243-3`: PASS through sequential 500-row batches, explicit confirmation, progress, and transaction-backed apply.
- `SCN-243-4`: PASS for blank, malformed, duplicate, unmatched, ambiguous, stale-preview, and batch-failure paths.
- `SCN-243-5`: PASS through the admin procedure and protected page boundary.

## Invariant Reconciliation

- `INV-243-1`: PASS. Only valid resolved targets are updated after apply.
- `INV-243-2`: PASS. Preview reads matching rows and returns a SHA-256 preview token.
- `INV-243-3`: PASS. Blank values are skipped, duplicates are rejected, and collisions are errors.
- `INV-243-4`: PASS. Existing matching HSN values are unchanged and no records are created.
- `INV-243-5`: PASS. Parsing errors, preview statuses, and apply failures are surfaced and downloadable where applicable.

## Flow and Architecture Review

- `FLOW-243-1`: PASS. Parse → normalize → server preview/token → explicit confirmation → 500-row apply batches → progress/audit summary.
- `FLOW-243-2`: PASS. Existing product and variant bulk update paths now carry HSN through to persistence.
- `DEP-243-1`, `DEP-243-2`, and `DEP-243-3`: PASS. Existing columns, auth/settings patterns, and finance audit facilities are reused.
- No migration or new architecture was introduced.

## Security and Integration Review

- `SEC-243-1`: PASS. Both server procedures use `adminProcedure`; the page is inside the protected dashboard.
- `SEC-243-2`: PASS. Matching uses exact product/variant SKU records and rejects ambiguous collisions.
- HSN master linking is best-effort and does not infer GST rates; `hsCode` remains the stored product/variant value.
- The supplied CSV was inspected read-only; no production update was performed.

## Scope and Drift Review

The implementation is within approved scope. The UI catches a failed batch, marks its rows failed, and continues later batches; this is compatible with the approved bounded-progress/error-reporting behavior and is not material drift.

## Test Expectation Review

- `TEXP-243-1`: PASS. `src/lib/product-import/hsn.test.ts` covers headers, blanks, duplicates, and ambiguity.
- `TEXP-243-2`: PASS. Existing general and brand import tests assert variant HSN persistence.
- `TEXP-243-3`: PASS statically. The route test verifies admin procedures, preview token, stale-preview rejection, and update targets.
- `TEXP-243-4`: PARTIAL. The workspace implements preview, confirmation, progress, and downloads, but no rendered component test was added.
- `TEXP-243-5`: PASS statically through the admin route boundary and protected page.
- `TEXP-243-6`: PASS statically through bounded batches, transaction, unchanged replay, and failure handling.

Focused HSN/import tests passed (10 tests); governance validation passed. The full repository suite has two unrelated existing failures: the festive product-type active-state timeout and the shop desktop navbar layout expectation.

## Findings

### REV-001

- Severity: LOW
- Category: test
- Description: The new workspace has source/static assertions but no rendered component test.
- Evidence: `TEXP-243-4`; route and helper tests exist, but no `product-hsn-import-workspace` component test exists.
- Impact: A future UI regression in progress, confirmation, or download rendering could escape automated coverage.
- Recommendation: Add a rendered component test when the dashboard test harness is next extended; no production blocker.

## Decisions Requiring Attention

None. Confirmed decisions `DEC-243-1`, `DEC-243-2`, and `DEC-243-3` are implemented as approved.

## Final Recommendation

`REVIEW_PASSED_WITH_FINDINGS`. The branch is suitable for PR review. No governance re-entry is required. Do not apply the supplied CSV to production automatically; use the new admin preview and explicit apply flow.

