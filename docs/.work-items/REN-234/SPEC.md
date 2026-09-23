# REN-234 — Commission Rules Admin Management UI

## Status

`READY_FOR_DEV` — Linear's 2026-09-22 remediation comment confirms the field list, conflict-preview exception, deterministic tie-break, fallback query boundary, and UI double-submit limitation are resolved.

## Goal

Give authorized finance users a safe admin UI for listing, filtering, sorting, creating, editing, deactivating, previewing overlaps, viewing history, and understanding fallback behavior for existing `commission_rules` records.

## Scope

- Add a page under `/dashboard/general/finance/commission-rules` in the existing Finance/Payouts module.
- Reuse the existing `commission_rules` table, `upsertCommissionRule` backend, finance access mechanism, audit log, `DataTable`, dialogs, toasts, and UI primitives.
- Add only thin read-only backend surfaces needed for admin labels, fallback/conflict preview, and per-rule history.
- Do not add rates, make business decisions, change payout resolution semantics, add a schema, or expose `holdbackPercentBps` as editable.

## Exact editable form contract

Required: `ruleName` (min 2), `commissionPercentBps` (integer >= 0), `effectiveFrom`, and `commissionBasis` (min 1).

Optional: `brandId`, `categoryId`, `productTypeId`, `priority` (integer, default 0), `effectiveTo`, `isActive` (default true), `notes`, `sourceStatus`, `agreementVersionId`, `approverName` (default Akshay), and `provisional` (default true).

`holdbackPercentBps` is omitted from the form because the mutation accepts only literal `0` and hardcodes `0` server-side. The form must explain basis points with a percentage equivalent.

## Backend design

1. Keep existing list/upsert mutation behavior and finance permission checks.
2. Add an admin list query that returns rule records plus display names for brand/category/product type without changing the payout resolver's candidate shape.
3. Add a read-only conflict/fallback query. It loads active rules through the existing list query, compares exact scope/date overlap for a blocking conflict, and compares different overlapping scopes for a non-blocking ambiguous-configuration warning. Representative winner explanations use the exported resolver and its priority → specificity → rule-ID ordering; no client-side rule algorithm is introduced.
4. Add a read-only history query gated by `payouts:view`, backed by the existing finance audit log and showing only recorded actor/time/action/before/after values.
5. Keep deactivation as the existing upsert with `isActive: false`; never delete rows.

## UI design

- Server page uses `assertFinanceModulePageAccess("payouts")` and renders a client workspace.
- Client workspace uses shared `DataTable` with brand/category column filters, sortable priority/specificity, active/inactive/all status, loading skeleton, empty state, retryable error state, and column visibility.
- View-only users see list, fallback, and history but no Create/Edit/Deactivate controls in the DOM.
- Manage users get a create/edit dialog, conflict preview before save, disabled in-flight Save with preserved form values on error, and a separate deactivate confirmation showing scope and resulting fallback.
- History is read-only and never fabricates fields not recorded by the audit mechanism.

## Invariants and safety

- Users without `payouts:view` or `payouts:manage` cannot access the page.
- Rules are never hard-deleted from this UI.
- Exact duplicate active scope/date conflicts block save; different-scope overlap warns but does not block.
- Conflict-query failure is visible and prevents save until retried successfully.
- No rate is inserted or changed automatically.
- Existing payout resolution remains the sole source of runtime rule selection.

## Verification

Required tests cover bps display/form payload, query conflict classifications and resolver winner, permission boundaries, required-field validation, mutation loading/error preservation, deactivation, history rendering, fallback, and route/page access. Run focused tests, `bun test`, and governance validation.

