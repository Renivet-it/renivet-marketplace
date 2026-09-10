# REN-102 — Type the admin finance queue

## Outcome

Remove all explicit `any` and `as any` usages from `admin-finance-queue.tsx`
by deriving its data model from the existing `listAdminFinance` tRPC output,
without changing finance behavior, permissions, requests, or rendering.

## Implementation contract

- Define `RouterOutputs = inferRouterOutputs<AppRouter>` and derive the finance
  result and element types from
  `RouterOutputs["general"]["corporatePlatform"]["listAdminFinance"]`.
- Use named aliases for orders, quotes, payments, refunds, purchase orders,
  payment requests, queue rows, and dialog props/state.
- Narrow upload results through their actual structural contract; do not use
  unsafe assertions to silence TypeScript.
- Preserve all runtime branches, mutation payloads, filtering, totals,
  pagination, dialogs, and permissions.
- Add a source regression test that rejects explicit `any`, `as unknown as`,
  and equivalent double assertions in the target file.
- Add targeted regression assertions for the existing quote/PO filters,
  collection totals, pagination, upload failure handling, and mutation payload
  fields so the type-only refactor cannot silently remove runtime behavior.
- Run the full Bun suite and TypeScript checking.

## Scope

Only the target component, its regression test, and task-local governance
artifacts. No API, service, schema, finance-rule, or UI behavior changes.
