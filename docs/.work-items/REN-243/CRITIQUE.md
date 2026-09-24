# REN-243 independent contract critique

## Review posture

Fresh read-only review of the REN-243 Linear contract and repository evidence. No source, schema, test, or production data was changed during this review.

## Findings

1. **DESIGN_BLOCKER — production tax-data mutation**
   - Evidence: the requested workflow updates catalog HSN values used by invoice/GST paths; the operation is a durable compliance-data write.
   - Contract response: preview is read-only, apply is explicit, the uploaded content is revalidated, production backfill is excluded from development, and the workflow skips blanks while rejecting duplicate/conflicting input.

2. **MAJOR — SKU identity ambiguity**
   - Evidence: both `products` and `product_variants` have SKU columns, and the existing bulk routes update them separately.
   - Contract response: exact-one matching is required; product/variant collisions and multiple matches are reported without mutation.

3. **MAJOR — silent partial completion**
   - Evidence: 6,562-row imports exceed a single request's safe size and per-row failures must be visible.
   - Contract response: bounded batches, progress, explicit row outcomes, and a downloadable error report are required.

4. **MINOR — input format drift**
   - Evidence: the supplied CSV says `HS Code`, while the internal field is `hsCode`; XLSX may contain equivalent header variants.
   - Contract response: server-side normalized header parsing accepts the documented aliases and rejects missing/ambiguous required columns.

## Category coverage

- Requirements/scenarios: covered.
- Failure/recovery: covered by preview revalidation, per-row outcomes, and batch progress.
- Security/privacy: covered by admin-only authorization and no cross-brand mutation path.
- State/data consistency: covered by exact-one matching and database-authoritative updates.
- Integration/idempotency: covered by revalidation and unchanged reporting.
- Compatibility/migration: no schema migration required by current evidence.
- Observability/testability: covered by audit summary and required test evidence.
- Assumptions/dependencies: durable write safeguards are recorded as explicit decisions below.
