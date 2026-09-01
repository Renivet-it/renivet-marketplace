# REN-179 Specification

## Goal

Prevent any corporate quote, order, proforma invoice, or tax invoice from being issued with an implicit GST rate or product-specific HSN fallback. Every taxable corporate line must carry an active authoritative HSN Master classification (or a separately approved override), and all downstream documents must consume that resolved snapshot without independent defaults.

## Linear context

- Title: [Corporate Order] Enforce HSN/GST classification before a corporate invoice can be issued (no silent 18% default)
- Priority: Urgent
- Status: Backlog
- Label: Bug
- Assignee: Ayan Ganguly
- Branch: `ayanganguly333/ren-179-corporate-order-enforce-hsngst-classification-before-a`
- Relations: REN-64 (HSN Master), REN-177 (commercial snapshot), REN-180 (document integrity), REN-186 (document identity)

## Evidence and current behavior

The normal corporate `buildQuote` path resolves `corporateProductTypes.hsnMasterId` to an active HSN Master row and already rejects a missing/inactive row. However, `createQuote` accepts caller-supplied totals without resolving or persisting the product HSN/rate, and `createManualQuote` accepts `hsnCode`/`gstPercent` independently of the active HSN Master. The corporate settings seed/default still contains `gstRateBps: 1800`, so it must not be used as a tax fallback.

The corporate tax invoice template has two unsafe independent fallbacks: an unresolved HSN ends in the literal `6109`, and an unresolved base rate ends in `order.gstRateBps ?? 500`. The customization line also hard-codes 18%. These can render a document whose printed HSN/rate disagrees with the amount charged. The service-issued invoice currently snapshots order totals, but the renderer can derive different display values. Existing documents and legacy orders need a compatibility policy that never invents a classification for a newly issued document.

## Locked acceptance criteria (Architecture Lock Pass, 2026-09-02)

For every customer-facing taxable corporate invoice: HSN is mandatory; GST comes from the authoritative HSN/tax master; no schema, settings, template, settlement, or customization layer may apply a generic 18%/5% rate; no hard-coded HSN such as `6109` is permitted; displayed GST must equal charged GST; effective statutory rules and transaction value are the computation basis; value-slab thresholds must be data-driven; the authority and effective version/date must be traceable; future rate changes must be data changes; and missing/invalid classification must fail closed. The enforcement mechanism may be implemented before the Finance/CA catalog data fix, but pilot issuance remains blocked until authoritative records exist.

The live audit confirmed independent defects remain in the current code: the corporate settings schema default `1800`, the tax invoice HSN fallback `6109`, the tax invoice rate fallback `500`, and the customization-line `1800`/`0.18` literals. The commission-GST `1800` in settlement is tracked under REN-181, not this product/HSN scope.

## Requirements

1. Trace every corporate quote/order/PI/tax-invoice issuance path and resolve taxable product HSN and GST rate from the active HSN Master or an explicit approved override.
2. Reject creation or issuance with a clear precondition/validation error when a required taxable line has no active classification; never silently use 18%, 5%, `6109`, zero, or another product's rate/code.
3. Persist the resolved HSN/rate and per-line tax basis in the authoritative corporate commercial snapshot so PI, fulfillment PO, tax invoice, settlement, exports, and PDF rendering agree.
4. Keep base garments and customization/extras as distinct tax lines. The base-line rate must be computed from the net, excluding-GST base-goods per-piece transaction value where the authoritative HSN rule requires a value slab; customization uses its own authoritative classification/rate or an explicitly approved override.
5. Manual/admin quote creation must use the entered GSTIN as currently specified by REN-176-era behavior, but GST classification must be resolved independently and must not trust a client-supplied percentage as an unapproved override.
6. Remove template-layer HSN/GST defaults and make unresolved snapshot data fail safely before issuance/rendering; old already-issued records may render only through an explicitly documented compatibility path that labels missing historical data rather than fabricating product facts.
7. Add focused service/schema/template tests for missing HSN, inactive HSN, authoritative-rate selection, net per-piece slab input, split-line tax totals, manual quote rejection/acceptance rules, and renderer fallback elimination.

## Scenarios

- SCN-001: A self-service quote with an active HSN Master resolves and stores that HSN/rate; GST matches the master's rate.
- SCN-002: A self-service, admin, or manual quote with a null/inactive/missing HSN is rejected before persistence or issuance.
- SCN-003: A caller submits a client GST percentage that differs from the HSN Master; the server ignores/rejects the unapproved value and uses the authoritative rate.
- SCN-004: An apparel HSN with a value-slab rule selects the slab from net base-goods unit value (`subtotal / quantity`), excluding GST and customization.
- SCN-005: A corporate commercial snapshot contains resolved base and customization lines, HSNs, rates, taxable values, tax amounts, and totals that reconcile exactly.
- SCN-006: PI, fulfillment PO, tax invoice, settlement/export, and PDF renderer consume the same snapshot and cannot diverge through local defaults.
- SCN-007: A tax invoice/PI request with an unresolved HSN or rate fails with a clear precondition and creates no issued document.
- SCN-008: A legacy already-issued document with incomplete historical metadata follows the compatibility policy without substituting `6109`, 5%, or 18% as if authoritative.
- SCN-009: Concurrent/retried quote or invoice issuance cannot create a partially classified or duplicate issued document; existing idempotency behavior is preserved.
- SCN-010: Only authorized corporate operations actors can invoke admin/manual quote or invoice issuance, and classification cannot be bypassed through crafted input.
- SCN-011: Finance/CA changes an HSN rate or composite-supply treatment in the master/approved override; new snapshots use the changed authority without code changes.

## Invariants

- INV-001: Every newly issued taxable corporate document has an explicit active HSN/rate source for every taxable line.
- INV-002: No application layer uses a generic GST rate or product-specific HSN literal as a silent fallback.
- INV-003: Slab-rate selection uses net base-goods per-piece transaction value, never invoice total or customization-inclusive value.
- INV-004: Snapshot line tax amounts sum to snapshot GST and document totals exactly.
- INV-005: All corporate document consumers read one authoritative commercial snapshot.
- INV-006: A failed classification check leaves no issued document or partially persisted quote/order classification.
- INV-007: Historical compatibility never presents fabricated HSN/rate data as current authority.
- INV-008: Classification and issuance remain behind existing corporate order-management authorization.

## Architecture and flows

- FLOW-001: Quote input -> server-side product/HSN Master resolution -> net per-piece rate selection -> split line calculation -> immutable commercial snapshot.
- FLOW-002: Approved quote/order -> pre-issuance classification assertion -> PI/PO/tax invoice/settlement readers consume snapshot.
- FLOW-003: Renderer receives only validated snapshot data; missing required classification raises a safe error or historical “not available” display according to policy.
- FLOW-004: HSN Master/approved override changes affect future snapshots; existing snapshots remain immutable.

## Dependencies and decisions

- DEP-001: REN-64 HSN Master integration is the authoritative source and must be reused.
- DEP-002: REN-177 commercial snapshot is the cross-document single source of truth; coordinate field names and migration order.
- DEP-003: REN-180 document date/GSTIN/HSN rendering fixes must not reintroduce local fallbacks.
- DEP-004: Existing corporate product catalog rows for Round Neck and Polo T-shirts require a Finance/CA-approved HSN/rate data fix before new pilot issuance.

Decision DEC-001 is resolved for this implementation slice (owner approval): no GST value will be hard-coded or populated by this task. Enforcement and data-source plumbing may proceed using the authoritative HSN Master; production catalog/rate population and pilot issuance remain gated on Finance/CA confirmation.

## Security, compatibility, and exclusions

Reuse `MANAGE_ORDERS` authorization and existing tenant/order scoping. Do not build a new HSN UI, alter non-corporate tax behavior, decide legal GST classification, or encode ₹ thresholds/rates from the Mili example. Do not rewrite already-issued financial documents. Additive migrations are preferred; any backfill must be explicitly safe and must not invent missing classifications.

## Verification expectations

Required: Bun unit tests for rate-source and net-per-piece calculations; service/API tests for every issuance path and missing/inactive HSN; integration tests proving snapshot/document reconciliation and idempotency; renderer tests proving no `6109`/500/1800 defaults; regression tests for existing classified orders; governance validation and full `bun test`.
