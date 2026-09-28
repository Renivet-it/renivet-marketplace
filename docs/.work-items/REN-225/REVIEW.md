# REVIEW: REN-225 — [FCCP][P1] Invoice-Numbering & Commission-Percentage Canonical Source (BIZ-6a / BIZ-6b)

## Executive Result

Result: `REVIEW_PASSED_WITH_FINDINGS`  
Drift: `NO_DRIFT`  
Comparison base: `ed2f9c0f0c6c6de91b402996513730586e189b4d` (REN-225 specification commit on the stacked feature branch)
Head: `61b8462003270294c38c5e45d80b0d77dba186ef`  
Governance re-entry: `false`

The implementation stays within the approved REN-225 contract. Focused tests, governance validation, and static integration inspection support the result. The findings below are non-blocking evidence gaps or hardening actions; none contradicts an approved requirement or security boundary.

## Review Scope and Git Evidence

The review covers the implementation commit after the REN-225 specification commit on `feat/ren-203-spec`. Prior stacked REN-203/204/205/206 implementation commits are outside this task comparison.

Changed implementation areas include:

- `src/lib/order-invoice-number.ts`, `src/lib/order-invoice.ts`, and order validation/query paths.
- `src/lib/finance/gst.ts` and `src/lib/finance/gst-invoice-number.ts`.
- Marketplace commission presentation/export consumers and corporate source classification.
- `src/lib/finance/commission-percentage.ts` and focused tests.

The worktree was clean at review time. The approved work item identity, Linear issue, task ID, and task-local artifacts all match `REN-225`. `bun run governance:validate -- docs/.work-items/REN-225/work-item.yaml` passed before this review artifact update.

## Requirement Reconciliation

- `REQ-225-001`: PASS — `attachCanonicalCommissionRates` resolves active `commission_rules` and adds `commissionPercentBps`; order/monthly/export consumers no longer use category commission values for active marketplace reporting. `commission-percentage.ts` centralizes formatting and unconfigured output.
- `REQ-225-002`: PASS — `payout-commission.ts` and payout calculation logic are not changed by REN-225; reporting reads the resolved rate without changing calculation semantics.
- `REQ-225-003`: PASS — `orders.invoice_number` remains authoritative; `ensureOrderInvoiceNumber` is idempotent under the row lock and generates only when absent.
- `REQ-225-004`: PASS — `createAuthoritativeInvoiceNumber` uses a fixed `INV-` plus 24-character random token format; no order, brand, sequence, or timestamp input is encoded, and the database uniqueness boundary is preserved.
- `REQ-225-005`: PASS — GST storefront rows read the stored invoice, corporate rows read the stored corporate tax invoice, and order IDs remain in the explicit order-reference column. The PDF no longer falls back to an order/receipt ID under the invoice label.
- `REQ-225-006`: PASS — existing invoice values are returned unchanged; missing historical values fail export validation rather than being regenerated.
- `REQ-225-007`: PARTIAL — forward-only behavior is implemented, but the deployment/effective-date boundary is not separately recorded in an operational setting or migration note.
- `REQ-225-008`: PASS — invoice creation is server-side, client-supplied invoice/rate fields are not accepted by the generator, and malformed rate/token inputs fail closed.

## Scenario Reconciliation

- `SCN-225-001`, `SCN-225-002`: PASS — canonical configured and explicit unconfigured rate behavior is implemented and unit-tested.
- `SCN-225-003`: PASS — corporate settlement presentation is explicitly labeled as agreed corporate commission and remains sourced from the corporate settlement snapshot.
- `SCN-225-004`, `SCN-225-005`: PARTIAL — pure generator behavior is tested, but database-level concurrent issuance and forced unique-collision recovery are not directly integration-tested.
- `SCN-225-006`: PASS — invoice and GST consumers use authoritative values or explicit references in the changed paths.
- `SCN-225-007`, `SCN-225-008`: PASS — stored legacy values remain readable and missing historical values do not trigger read-side generation.
- `SCN-225-009`: PARTIAL — bounded retry and unique-violation handling are present, but the transaction boundary lacks a deterministic integration fixture.
- `SCN-225-010`: PASS — no client input path was added for invoice or commission authority.

## Invariant Reconciliation

- `INV-225-001`: PASS — existing-value return plus unique storage constraint preserve one issued value per order.
- `INV-225-002`: PASS — legal invoice rendering no longer substitutes order or receipt IDs.
- `INV-225-003`: PASS — active marketplace reporting derives from `commissionPercentBps` resolved from `commission_rules`.
- `INV-225-004`: PASS — no migration or read-side write/backfill was added.
- `INV-225-005`: PARTIAL — implementation is transaction-safe by inspection, but concurrency needs runtime integration evidence.
- `INV-225-006`: PASS — invalid/missing generation paths fail closed.
- `INV-225-007`: PASS — corporate snapshot displays are preserved and relabeled rather than mixed with marketplace rule values.

## Flow and Architecture Review

- `FLOW-225-001`: PASS — rule resolution and percentage formatting are separated from payout calculation.
- `FLOW-225-002`: PASS — invoice issuance remains at the existing server-side boundary, with row locking, secure generation, persistence, and existing-value reuse.
- `FLOW-225-003`: PASS — legacy reads use persisted values and missing values produce bounded validation failures.
- `FLOW-225-004`: PARTIAL — retry logic is explicit and bounded, but database collision behavior is not covered by a live fixture.

`DEP-225-001` through `DEP-225-005` are respected. `INT-225-001` through `INT-225-004` are wired through the existing database, export, PDF, delivery, and admin/customer paths. No new schema or migration is required for REN-225; the existing unique index remains the collision boundary.

## Security and Integration Review

- `SEC-225-001`: PASS — only trusted server-side code calls `ensureOrderInvoiceNumber`.
- `SEC-225-002`: PASS — generated tokens do not use internal identifiers or timestamps.
- `SEC-225-003`: PASS — invoice and reference labels are separated in PDF/export paths; existing API authorization boundaries are preserved.
- `SEC-225-004`: PASS — commission presentation is derived data and no client-controlled percentage source was introduced.

The database transaction, unique index, GST export, customer invoice PDF, delivery invoice, and corporate tax-invoice integrations have bounded failure behavior. Integration runtime coverage remains incomplete as noted in `REV-225-001` and `REV-225-004`.

## Scope and Drift Review

The implementation is `NO_DRIFT`. It changes only approved invoice identity, commission presentation source, reference labeling, legacy category UI wording, and tests. It does not backfill data, change payout calculation/rate resolution, redesign corporate numbering, or execute production financial actions.

The legacy `categories.commission_rate` column remains for compatibility, but the admin UI labels it as legacy and disables editing; active payout/reporting consumers use resolved `commission_rules` data.

## Test Expectation Review

- `TEXP-225-001`: PASS — canonical formatting/configured-state unit tests exist in `commission-percentage.test.ts`.
- `TEXP-225-002`: PASS — existing REN-203 commission tests remain present; source inspection confirms no payout calculation change.
- `TEXP-225-003`: PASS — invoice format and non-identifying token tests exist in `order-invoice-number.test.ts`.
- `TEXP-225-004`: PARTIAL — transaction retry is implemented, but no database-backed concurrent/collision fixture exists.
- `TEXP-225-005`: PASS — GST identity helper tests and changed document/export consumers cover stored, missing, and reference cases statically.
- `TEXP-225-006`: PASS — server-side boundaries and validation are visible in the changed code.
- `TEXP-225-007`: PARTIAL — business UAT is specified but an authenticated runtime walkthrough is not recorded in the repository.

## Findings

### REV-225-001

- Severity: MEDIUM
- Category: test
- Description: Database-level concurrent issuance and forced unique-collision recovery are implemented but not covered by a deterministic integration fixture.
- Evidence: `REQ-225-003`, `REQ-225-004`, `SCN-225-004`, `SCN-225-009`, `TEXP-225-004`; `src/lib/order-invoice.ts` retry loop and `src/lib/order-invoice-number.test.ts` pure generator tests.
- Impact: A regression in transaction rollback or unique-violation detection could issue an uncommitted/duplicate legal invoice value without being caught by the focused unit suite.
- Recommendation: Add a non-production database test seam that forces one collision and runs two issuance attempts for the same order.

### REV-225-002

- Severity: MEDIUM
- Category: requirement
- Description: The forward-only cutover behavior is coded, but the effective deployment/date boundary is not separately recorded for operations and audit review.
- Evidence: `REQ-225-006`, `REQ-225-007`, `BR-225-004`; `src/lib/order-invoice.ts` preserves old values and `src/lib/finance/gst.ts` rejects missing values, but no cutover marker is present.
- Impact: Finance operators may lack a single operational reference for distinguishing legacy-format and new-format invoice populations.
- Recommendation: Record the effective cutover commit/deployment date in the REN-225 PR/release notes and add bounded reporting for legacy versus new-format values.

### REV-225-003

- Severity: LOW
- Category: scope
- Description: The legacy category commission column and API shape remain in the database for compatibility, although the UI now marks it as legacy and active calculations/reporting use `commission_rules`.
- Evidence: `REQ-225-001`, `REQ-225-002`; `src/lib/db/schema/category.ts`, `src/components/globals/forms/category-manage.tsx`, `src/components/dashboard/general/categories/categories-table.tsx`.
- Impact: Future code could accidentally reintroduce the deprecated field as an independent commission source.
- Recommendation: Keep the compatibility field read-only and add a future deprecation/removal task once historical consumers are confirmed absent.

### REV-225-004

- Severity: LOW
- Category: test
- Description: The contract requests authenticated business UAT across configured/unconfigured commission states and customer/brand invoice/reference surfaces, but no walkthrough evidence is stored.
- Evidence: `TEXP-225-007`, `SCN-225-001`, `SCN-225-003`, `SCN-225-006`, `SCN-225-007`; repository contains automated tests but no authenticated walkthrough artifact.
- Impact: Environment-specific document wiring or data-shape issues could remain undiscovered until finance review.
- Recommendation: Run the approved non-production walkthrough and attach the evidence to the PR/release record.

## Decisions Requiring Attention

None. The approved decisions `DEC-225-001` through `DEC-225-004` remain within their recorded boundaries.

## Final Recommendation

REN-225 is implementation-complete with non-blocking follow-ups. The canonical commission source, secure forward-only invoice generator, GST/reference classification, legacy preservation, and document labeling are implemented without material drift. Complete `REV-225-001`, record `REV-225-002`, and perform `REV-225-004` before treating the change as fully production-validated.
