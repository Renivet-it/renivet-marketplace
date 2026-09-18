# REN-225 Independent Critic Review

Review mode: fresh-context, read-only review of the Linear REN-225 contract, repository evidence, and proposed design. No application, schema, migration, test, Linear, or production changes were made by this review.

## Findings

### CRIT-225-001 — MAJOR — Commission source boundary must not erase corporate snapshot semantics

The repository has marketplace `commission_rules` resolution in `src/lib/finance/payouts.ts`, but corporate settlement statements persist an order-specific `commissionPercentBps` and render it in customer/brand-facing settlement documents. Treating every percentage in the repository as marketplace `commission_rules` would change corporate commercial-document meaning. The specification correctly keeps this as a separate classified domain and requires an explicit source label. Implementation review must enumerate each consumer and prove it is either marketplace-rule-derived or an agreed corporate snapshot.

### CRIT-225-002 — MAJOR — Invoice issuance must be transactionally idempotent under collision and concurrency

`src/lib/order-invoice.ts` currently locks the order row and increments a brand/year sequence. Replacing the generator with random tokens must preserve the existing lock, database unique constraint, retry bounds, and existing-value return. A collision or failed persistence must not return a token that was not committed. The required integration tests need a deterministic collision seam rather than relying on probability.

### CRIT-225-003 — MAJOR — GST export currently has no safe missing-authoritative-invoice policy

`src/lib/finance/gst.ts` fabricates `INV-<month>-<order-id-suffix>` values. The implementation must stop doing this for the legal invoice column. For historical orders without `invoice_number`, the contract must choose and test an explicit bounded error or a separately labeled non-invoice reference; silently generating a new invoice during export would violate the forward-only rule.

### CRIT-225-004 — MINOR — The cutover boundary needs an operational date and observability

The issue requires a clear before/after boundary. The implementation PR should record the deployment/effective timestamp or version boundary, add bounded logs/metrics for missing legacy invoice values and rejected custom inputs, and avoid logging full customer or payment data.

### CRIT-225-005 — MINOR — Existing fallback rendering can mislabel references as invoices

`src/components/pdf/invoice-template.tsx` falls back from `invoiceNumber` to `receiptId` or `id`. The implementation must ensure this fallback is not used for a customer/legal invoice heading, or must render the fallback explicitly as a reference and fail the legal invoice path when the authoritative value is absent.

## Category coverage

- Requirements and scenarios: covered; source-domain separation and missing-value behavior are explicit.
- Failure and recovery: covered; collision, persistence failure, concurrency, and export gaps are called out.
- Authentication, authorization, security, privacy: covered; server-only issuance and non-identifying tokens are required.
- State transitions and data consistency: covered; idempotent issuance and no historical mutation are invariants.
- Integrations, retries, idempotency: covered; database, export, PDF, delivery, and admin/customer surfaces are listed.
- Backward compatibility and migration: covered; forward-only cutover and legacy preservation are explicit.
- Observability and testability: covered; deterministic collision injection and bounded diagnostics are required.
- Hidden assumptions and dependencies: covered; REN-203/REN-209 and the corporate snapshot domain are identified.

No design blocker remains because the issue already supplies the business decisions, and the remaining design choices are recorded with bounded recommendations and no historical-data mutation.

