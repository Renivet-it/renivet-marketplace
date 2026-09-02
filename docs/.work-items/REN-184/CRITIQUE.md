# REN-184 Critic Review

Independent fresh-context, read-only review of the REN-184 specification and repository.

## Findings

### CRIT-001 — RESOLVED

User approval resolved DEC-001 and DEC-002: commission GST compares Renivet and brand registered states; missing delivery state uses verified billing/registered fallback, records the source, and does not block documents.

### CRIT-002 — MAJOR

REQ-003/INV-001/SCN-003 are not satisfied by the current implementation: GSTIN-prefix or registration proxies remain in `commission-invoice.pdf/route.tsx:152-160`, `corporate-brand-invoice-validation.ts:56-60`, `corporate-order.ts:268-295`, and `corporate-platform.ts:4232-4279`. No shared leg-aware resolver exists.

### CRIT-003 — MAJOR

REQ-001/REQ-005/INV-005 have unsafe defaults. `stateFromGstin` can default to Karnataka, generic GST splitting treats missing states inconsistently, and invoice paths fall back to billing/city/warehouse/default states instead of failing closed.

### CRIT-004 — MAJOR

REQ-002/INV-004/SCN-006 require immutable place-of-supply snapshots, but `corporateOrders` lacks a persisted delivery-state column and issued tax invoices do not persist place-of-supply/source. PDF output can therefore change after address edits.

### CRIT-005 — MAJOR

REQ-004/INV-003 and INT-001/002 require independent per-leg contexts and one consistent result, but invoice routes and the finance GST export recompute state independently and can disagree.

### CRIT-006 — MAJOR

TEXP-001/002/004/005 coverage is absent for a shared resolver, fail-closed ambiguity, immutable issued place of supply, and all document routes. Rounding conventions also differ and need one tested policy.

### CRIT-007 — MINOR

Corporate tax-invoice rendering exposes billing/place-of-supply fields but does not yet represent registered address and ship-to as distinct first-class fields.

## Category coverage

Requirements/scenarios: covered by the approved contract; implementation must remove the listed proxy paths. Failure/recovery: partial pending resolver and fallback-source implementation. Security/privacy: partial pending immutable POS snapshots. State/data consistency: partial pending per-leg persistence. Integrations/idempotency: partial pending shared resolver adoption. Compatibility/migration: partial pending delivery/POS migration. Observability/testability: partial pending resolver/fallback tests. Assumptions/dependencies: resolved by the user-approved rules.
