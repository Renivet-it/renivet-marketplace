# REN-253 Critique

## Review state

Independent read-only L3 Critic pass completed against the Linear issue, approved decision comments, written design, repository evidence, and the Stage 1 / execution-scope references. No application code, schema, migration, test, or production artifact was changed.

## Findings

- DESIGN_BLOCKER: The original commission fallback disposition was unresolved. Resolved in Linear: fail closed and do not invent a rate.
- DESIGN_BLOCKER: The recalculation state set was unspecified. Resolved: only `draft` and `calculated` are allowed.
- DESIGN_BLOCKER: Statement authorization was unspecified and the route had no visible guard. Resolved: existing payout finance view/manage access or site Admin inheritance; no brand-role access.
- MAJOR: The provider replay boundary must use a stable cycle-and-brand identity and prevent a repeated completed execution. The execution plan must identify the existing persistence boundary and provider idempotency field without authorizing a payout.
- MAJOR: Order Operations and Return/Replace had separate RTO write paths. Resolved: Return/Replace is authoritative; Order Operations must route or stop writing directly.
- MAJOR: Deployment/migration evidence and release approval must remain separate from implementation completion. Resolved: Ayan records evidence; Akshay owns release decision.
- MAJOR: `src/app/api/finance/payouts/[cycleId]/statement/[brandId]/route.tsx` currently loads the payout cycle and line items before any visible finance authorization. Authorization must happen before sensitive reads and PDF rendering, while preserving the existing PDF response.
- MAJOR: `calculatePayoutCycle` currently loads and recalculates without a visible `draft`/`calculated` state guard. The service boundary, not only the tRPC route, must reject `approved`, `processing`, `completed`, and `failed` cycles.
- MAJOR: Approval/execution state is persisted in cycle summaries and provider-facing execution code; tests must prove same-actor separation, completed replay rejection, partial provider failure behavior, and no duplicate cycle-and-brand submission.
- MAJOR: The current commission calculation has generic zero fallback behavior in shared calculation helpers. REN-253 must ensure payout commission resolution fails closed for missing approved commission policy without changing unrelated checkout-tax behavior.

## Scope guard

No payout clearance, payout execution, production-data mutation, new commercial policy, or broad refactor is permitted. Validation must use a non-production database/provider path and must not submit a real payout.
