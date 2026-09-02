# REN-180 independent Critic review

Reviewer: `ren180_critic`  
Mode: fresh-context, read-only  
Categories: all required categories reviewed

## Findings

- **DESIGN_BLOCKER — requirements/scenarios:** REQ-002/REQ-003 do not identify the concrete issuance entrypoints, validation contract, or machine-readable errors. `ensureProformaInvoiceForOrder` currently inserts `issued` records without GSTIN/HSN/snapshot checks (`src/lib/services/corporate-documents.ts:265-325`).
- **DESIGN_BLOCKER — failure/recovery:** DEC-001 is unresolved and current route/template fall back to `new Date()` (`corporate-proforma-invoices/[id]/download/route.tsx:364-369`, `corporate-commercial-document-template.tsx:275-280`), which can fabricate dates. Define precedence and fail-closed behavior for malformed date and valid-until values.
- **MAJOR — security/privacy:** Existing PI and summary authorization paths do not explicitly establish corporate tenant/org scope or audit requirements (`corporate-proforma-invoices/[id]/download/route.tsx:60-105`). Add ownership/admin negative tests for GSTIN/address PII.
- **DESIGN_BLOCKER — state/data consistency:** The exact REN-177 snapshot adapter/version/hash and atomic reconciliation rule are unspecified. Current PI GST derivation and order-summary raw advance/balance reads violate the intended single source.
- **DESIGN_BLOCKER — integrations/idempotency:** Commission numbering is minted inline on every download and is not persisted/uniquely constrained (`corporate-orders/[id]/commission-invoice.pdf/route.tsx:142-143`). PI ensure also has check-then-insert race potential.
- **MAJOR — compatibility/migration:** Nullable legacy dates/GSTIN/HSN and the absence of a `shipTo` field in the template data model require a compatibility and payload/schema plan; immutable-record/regeneration behavior is not yet machine-readable.
- **MAJOR — observability/testability:** Add structured issuance-block errors/audit events, numbering collision telemetry, snapshot/version logging, and tests for malformed snapshots, concurrency, regeneration blocks, PII boundaries, and no-shipping rows.
- **DESIGN_BLOCKER — assumptions/dependencies:** Finance/CA tax treatment and REN-177/179/186 contracts remain unresolved, while SCN-004 requires exact GST/totals. The reseller declaration must be specified verbatim; current PI and commission text still says supplier/facilitation.

## Recommendation

Keep approval `BLOCKED`. Resolve the Class C date/migration and tax decisions, freeze the snapshot/identity contracts, then revise the issuance, ship-to, numbering, and observability sections before implementation.
