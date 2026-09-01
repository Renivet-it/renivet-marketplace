# REVIEW: REN-178 — Customization/extras persistence through corporate documents

## Executive Result

REVIEW_FAILED with MATERIAL_DRIFT. The implementation adds structured quote/order/FO storage, but does not satisfy the approved end-to-end immutable snapshot contract. Governance re-entry is required. Base `122a62023fd396f7c94b9889b67a705a09addde1`; head `a1036c7dba482b6b70a7070af65e07dad558eb1d`.

## Review Scope and Git Evidence

Reviewed the approved REN-178 work item, Linear issue, base-to-head diff, customization helper, quote/manual quote services, order conversion, FO issuance, UI payloads, schema/migration, and corporate invoice/document readers.

## Requirement Reconciliation

- REQ-001: PARTIAL — structured rows are normalized and persisted for quote/order/FO, but the database table still stores many required fields only inside metadata.
- REQ-002: FAIL — PI, customer invoice, settlement, and quote revision paths do not all persist/read the same immutable customization snapshot.
- REQ-003: PARTIAL — FO now has a customization column and reads order rows, but the UI mutation does not submit a structured customization list.
- REQ-004: FAIL — no scalar backfill migration creates `Legacy Customization` rows for historical data.
- REQ-005: FAIL — the invoice template still derives base tax from legacy fields and does not implement the approved parent/separate tax treatment contract end to end.
- REQ-006: PARTIAL — existing authorization remains, but parent-plus-customization writes are not consistently transactional or concurrency-safe.

## Scenario Reconciliation

SCN-001, SCN-002, and SCN-004 are PARTIAL. SCN-003, SCN-005, and SCN-006 FAIL because revision/migration/atomicity and downstream immutable-document assertions are absent.

## Invariant Reconciliation

INV-001 is PARTIAL. INV-002, INV-003, INV-004, and INV-005 FAIL for downstream snapshot equality, migration preservation, and atomic write guarantees.

## Flow and Architecture Review

FLOW-001 is partially implemented through `buildCorporateCustomizationRows` and quote/order inserts. FLOW-002 fails because PI/invoice/settlement readers continue using scalar/aggregate values rather than a shared customization snapshot. FLOW-003 fails because no historical backfill or explicit unavailable policy was added.

## Security and Integration Review

Existing MANAGE_ORDERS boundaries remain in place. Artwork references are stored as metadata but are not independently validated or ownership-checked. The new FO column migration is present, but no transaction/outbox or uniqueness guard closes concurrent duplicate FO issuance.

## Scope and Drift Review

MATERIAL_DRIFT: the delivered behavior is narrower than the approved Quote → PI → Order → FO → Invoice → settlement contract and omits the required legacy migration. The task must re-enter governance before acceptance.

## Test Expectation Review

TEXP-001, TEXP-002, and TEXP-003 are not covered by an end-to-end test. TEXP-004 has only the helper unit test; migration, authorization, upload, concurrency, and document immutability coverage are missing.

## Findings

### REV-001

- Severity: BLOCKER
- Category: requirement
- Description: PI, invoice, settlement, and quote revision consumers do not use one immutable customization snapshot.
- Evidence: REQ-002/INV-002; `corporateProformaInvoices`, `corporateTaxInvoices`, and `corporateSettlementStatements` remain aggregate-only while rows are written to `corporateCustomizations`.
- Impact: Customer-facing documents can diverge or omit customization data.
- Recommendation: Add canonical snapshot/version linkage and update every downstream reader before re-review.

### REV-002

- Severity: BLOCKER
- Category: compatibility
- Description: Historical scalar customization amounts are not backfilled into `Legacy Customization` rows.
- Evidence: REQ-004/SCN-003; migration `0273_corporate_fo_customizations.sql` only adds the FO JSON column.
- Impact: Existing orders remain dependent on the old scalar and cannot meet the new model.
- Recommendation: Add an idempotent expand/backfill migration with reconciliation counts.

### REV-003

- Severity: HIGH
- Category: architecture
- Description: Parent-plus-customization writes are split across independent inserts and FO issuance has no duplicate uniqueness guard.
- Evidence: REQ-006/SCN-006; `createQuote` and order conversion insert parent and customization records separately; FO uses check-then-insert.
- Impact: Partial persistence and duplicate documents are possible on failure or concurrency.
- Recommendation: Use a transaction and enforce order-level FO uniqueness/idempotency.

### REV-004

- Severity: HIGH
- Category: requirement
- Description: UI and invoice paths still reconstruct customization/tax values from scalar or heuristic fields.
- Evidence: REQ-005/INV-004; `corporate-document-chain-panel.tsx` and `corporate-tax-invoice-template.tsx` do not consume a complete canonical customization snapshot.
- Impact: Displayed totals can differ from persisted customization records.
- Recommendation: Make canonical snapshot data the only source for customization rows and approved tax treatment.

## Decisions Requiring Attention

None; the approved decisions are clear. The findings are implementation gaps.

## Final Recommendation

Do not close REN-178 yet. Complete REV-001 through REV-004, add the required end-to-end/migration/concurrency tests, then rerun SPEC governance and REVIEW.
