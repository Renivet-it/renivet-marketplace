# REN-181 — Settlement statement integrity

## Outcome

Corporate settlement statements must be financially reproducible and auditable. Issuance must use real persisted order/invoice values, never placeholder fallbacks; an issued statement is immutable; corrections create a versioned adjustment with actor/time/reason; reseller-mode statements do not apply marketplace TCS/194-O by default; and numbering uses the declared shared corporate authority.

## Evidence reviewed

- Linear REN-181 description and 2026-09-01/2026-09-02 updates.
- `src/lib/services/corporate-documents.ts:604-709`: settlement generation currently deletes prior rows, fabricates `802000`/`102000` when invoice data is absent, hard-codes 18% commission GST and TCS/194-O deductions, and calls undeclared `SET` numbering.
- `src/app/api/corporate-orders/[id]/commission-invoice.pdf/route.tsx:117-134`: commission fallback fabricates 10% of subtotal and defaults GST to 18% (owned by REN-181 for no-fabrication alignment).
- `src/lib/db/schema/corporate-platform.ts`: settlement statements have no version/adjustment/actor linkage and nullable correction semantics.
- Existing corporate document sequence service and settlement PDF renderer.

## Design

1. Add a settlement statement version/adjustment model (version number, supersedes reference, issued actor, issued timestamp/reason) with a uniqueness rule per order/version. Never delete an issued row.
2. Before issuance, require an issued Customer Tax Invoice or authoritative order snapshot with non-null gross, GST, and commission values. Missing values return structured errors; remove `802000`, `102000`, 10%-of-subtotal, and other fabricated defaults.
3. Add `SET` to the typed `nextCorporateDocumentNumber` prefix union and allocate settlement numbers through that authority. Retries for an already-issued order return the existing current statement; adjustments allocate a new version and number transactionally.
4. Represent TCS/194-O as explicit deduction policy/configuration. Default both to zero/absent for reseller corporate orders; only an explicitly enabled, Finance-approved policy may calculate them. Do not silently infer marketplace status.
5. Keep commission GST rate/classification configurable from approved Finance/HSN metadata. Do not decide the legal rate in this task; block issuance when required classification is unavailable.
6. Render gross, commission, commission GST, permitted deductions, net payable, settlement reference, issue date, and version from the immutable statement row.
7. Add structured audit/error events for issuance, duplicate/idempotent retry, adjustment, missing source data, and policy gating. Preserve existing authorization and tenant boundaries.

## Explicit exclusions

- Finance/CA determination of the exact commission GST rate/classification.
- General-purpose ledger implementation.
- REN-185’s statutory TDS threshold correction.
- Commission-invoice numbering implementation beyond removing its fabrication fallback; REN-180 owns its broader document identity work.

## Decisions / assumptions

- A repeated issue call returns the current issued statement without mutation; corrections require an explicit adjustment input with reason.
- Existing issued rows are immutable. A migration adds version metadata with legacy rows treated as version 1/current.
- Reseller corporate order type is the default policy context; TCS/194-O are zero/omitted unless a future explicit policy flag is enabled.
- Missing invoice/order financial source data fails closed with machine-readable error codes.

## Acceptance example

For the Mili AI corporate order, a second issuance does not delete the first statement; no `802000`/`102000` or 10% fallback appears; commission/GST/deductions/net payable reconcile to persisted values; TCS/194-O are absent by default; the statement number is a valid `SET/<FY>/<sequence>` number; and a correction is a new version linked to the prior statement with actor, timestamp, and reason.
