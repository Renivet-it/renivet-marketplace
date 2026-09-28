# REN-234 Commission Rules Admin UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a protected Finance/Payouts admin UI for managing existing commission rules with server-side conflict/fallback/history support.

**Architecture:** Keep `commission_rules`, `upsertCommissionRule`, and `resolveCommissionRuleFromCandidates()` as the business source of truth. Add thin finance tRPC read queries for joined display data, conflict/fallback preview, and audit history; render a client `DataTable` workspace under the existing finance page-access boundary.

**Tech Stack:** Next.js App Router, React, TanStack Table, tRPC, Drizzle, Zod, Bun tests, existing Renivet dashboard UI primitives.

**Spec:** `docs/.work-items/REN-234/SPEC.md`

## Global Constraints

- Do not add a schema or migration.
- Do not insert or change business commission rates.
- Do not expose `holdbackPercentBps` as editable.
- Enforce finance permissions server-side; UI hiding is secondary.
- Reuse resolver precedence and the exact approved field contract.
- Exact active overlap blocks; different-scope overlap warns.

## Review Focus

- View-only user: mutation controls absent from DOM and server mutations denied.
- Missing required `commissionBasis`/`ruleName`: inline validation before network call.
- Conflict query failure: retryable error, Save remains unavailable.
- Different-scope overlap: warning names rules and resolver winner without client precedence logic.
- Deactivation/history: row remains inactive and audit data is not fabricated.

---

### Task 1: Commission-rule pure conflict/fallback helpers

**Files:**
- Modify: `src/lib/finance/payout-commission.ts`
- Test: `src/lib/finance/payout-commission.test.ts`

**Interfaces:**
- Produce exported helpers for specificity and scope/date overlap used by the server preview query; preserve `resolveCommissionRuleFromCandidates()` behavior exactly.

- [ ] **Step 1: Write failing tests** for exact scope overlap, different-scope overlap, open-ended date ranges, boundary dates, and specificity sorting.
- [ ] **Step 2: Run** `bun test src/lib/finance/payout-commission.test.ts` and confirm the new helper imports/expectations fail.
- [ ] **Step 3: Implement** minimal exported helpers and reuse them in the existing resolver without changing ordering.
- [ ] **Step 4: Run** the focused test and confirm it passes.
- [ ] **Step 5: Commit** `test/feat: add commission rule conflict helpers`.

### Task 2: Finance read queries and tRPC surfaces

**Files:**
- Modify: `src/lib/db/queries/finance-compliance.ts`
- Modify: `src/lib/trpc/routes/general/finance.ts`
- Modify: `src/lib/db/queries/audit-log.ts` only if a reusable filtered history surface is needed
- Test: `src/lib/finance/commission-rule-admin.test.ts`

**Interfaces:**
- `listCommissionRuleAdminRows(filters)` returns rules with brand/category/product-type labels and metadata.
- `previewCommissionRule(input)` returns `{ kind: "none" | "conflict" | "ambiguous", conflicts, winner }` and fallback resolution data.
- `listCommissionRuleHistory(ruleId)` returns only existing audit fields.

- [ ] **Step 1: Write failing query/contract tests** for payouts view/manage authorization, exact conflict, ambiguous overlap, no conflict/fallback, and history field passthrough.
- [ ] **Step 2: Run** `bun test src/lib/finance/commission-rule-admin.test.ts` and verify the new surfaces fail.
- [ ] **Step 3: Implement** Drizzle joins and server-side preview using the existing active-rule list and exported resolver; call `assertFinanceAccess(ctx, "payouts", "view/manage")` as appropriate.
- [ ] **Step 4: Preserve backend validation/error details** and ensure query failure is distinguishable from a no-conflict response.
- [ ] **Step 5: Run** focused backend tests and governance validation.
- [ ] **Step 6: Commit** `feat: add commission rule admin read surfaces`.

### Task 3: Admin page and table workspace

**Files:**
- Create: `src/app/(protected)/dashboard/general/finance/commission-rules/page.tsx`
- Create: `src/components/dashboard/general/finance/commission-rules-workspace.tsx`
- Modify: `src/app/(protected)/dashboard/general/finance/page.tsx` to add the finance navigation card/link if the existing card list is the canonical entry point
- Test: `src/components/dashboard/general/finance/commission-rules-workspace.test.tsx`

**Interfaces:**
- Page enforces `assertFinanceModulePageAccess("payouts")`.
- Workspace consumes tRPC list/preview/history/upsert surfaces and uses shared `DataTable`/dialog/button/input primitives.

- [ ] **Step 1: Write failing component tests** for view-only DOM controls, loading/error/empty states, bps display, filters/sorts, conflict warning, and deactivation/history actions.
- [ ] **Step 2: Run** the focused component test and confirm the expected UI is absent/not implemented.
- [ ] **Step 3: Build** the DataTable with brand/category filters, priority/specificity sorting, status filter, active/inactive rows, and fallback inline note.
- [ ] **Step 4: Build** create/edit form with the exact approved fields, bps helper, required-field validation, and no holdback input.
- [ ] **Step 5: Add** conflict-preview gating, retry handling, in-flight Save disabling, error value preservation, deactivation confirmation, and read-only history panel.
- [ ] **Step 6: Run** focused component tests and verify all states.
- [ ] **Step 7: Commit** `feat: add commission rules admin workspace`.

### Task 4: Full verification and review

**Files:**
- Modify: `docs/.work-items/REN-234/work-item.yaml` only through the review workflow
- Create: `docs/.work-items/REN-234/REVIEW.md` through `renivet-review`

- [ ] **Step 1:** Run `bun test`.
- [ ] **Step 2:** Run `bun run governance:validate -- docs/.work-items/REN-234/work-item.yaml`.
- [ ] **Step 3:** Run `git diff --check` and inspect the diff for schema/rate/payout-resolution changes.
- [ ] **Step 4:** Invoke `$renivet-review REN-234` and address only review-governed findings.
- [ ] **Step 5:** Commit the final review artifact and report exact verification results.
