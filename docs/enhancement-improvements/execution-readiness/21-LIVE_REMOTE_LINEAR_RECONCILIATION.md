# Gate — Live Remote + Linear Reconciliation (2026-08-31)

Fresh reconciliation pass, superseding `01-P0_TRACKING_RECONCILIATION.md` through `20-FINAL_READINESS_DECISION.md` (2026-08-30) wherever this pass found different live evidence. Local branch state, prior terminal summaries, and prior Claude conclusions were explicitly NOT trusted — every claim below was re-verified this session against `origin/master` and live Linear.

## Remote Git

- `git remote -v`: `origin` → `https://github.com/Renivet-it/renivet-marketplace.git`
- `git fetch --all --prune`: `main` advanced `9964873b..29878e30`; `master` advanced `4943c40a..0423b6be`
- `git ls-remote origin HEAD refs/heads/master refs/heads/main`: **HEAD == `refs/heads/master` == `0423b6be32340155d480aa5fc49d3f88eeff1523`**. `master` is the production/default branch (confirmed, not assumed).
- Local checked-out branch (`docs/staging-readiness`) has diverged (56 ahead / 2 behind `origin/docs/staging-readiness`) and carries uncommitted staged changes (`.gitignore`, `package.json`) plus untracked files. **None of this was treated as production/shipped state** — all code verification in this pass reads `origin/master` directly via `git show origin/master:<path>`, not the local working tree.
- Latest 5 commits on `origin/master`: `0423b6be` (merge PR #601, REN-111 guest-redirect fix), `122a6202` (test: guest auth redirect flows), `a73eee3f` (docs: REN-111 review), `30e17709` (fix: guest login redirect), `4bcab8ca` (merge PR #599, **REN-131/REN-132 purchase-cart analytics**).

## Live Linear

- Single team in this workspace: **Renivet** (key `REN`). There is no separate "DEF" team — `DEF-*` identifiers throughout `qa/` are QA-finding identifiers from the audit documents, not Linear issue keys. This is expected and unchanged from the prior pass's own framing.
- 4 Linear Projects exist, all under team Renivet: **Customer Tracking & Analytics Instrumentation**, **Automated Testing Rollout**, **Guest Journey QA Findings**, **Security & Compliance Audit**. None of these correspond 1:1 to the `P01`/`P02`/`P05`/`P06`/`P08` naming used in `docs/enhancement-improvements/projects/` — see `24-CURRENT_PROJECT_STATUS.md` for the full reconciliation of that distinction.
- Re-ran the duplicate search for DEF-009/010/002/003 this session (keyword queries: "permission", "api/permission", "cross-tenant", "Delhivery", "inventory", "double-decrement", "Unicommerce", "brand-router", plus a full listing of the Security & Compliance Audit project's issues): **zero pre-existing matches**, consistent with the 2026-08-30 pass's own finding. Confirmed genuinely still untracked before this session's issue-creation actions (§`22-P0_CREATION_RESULT.md`).

## Material change found this pass that the prior reconciliation could not have known about

**REN-131 shipped between the two passes.** The 2026-08-30 reconciliation (`02-REN131_133_SEQUENCE.md`) found REN-131 `Backlog`, not yet implemented, and recommended the sequence REN-144 → REN-131 → REN-133 specifically so REN-131's emission logic would be built against REN-144's fixed persistence behavior. Live Linear now shows **REN-131 `Deployed to Prod`** (commit `8a5c8a4a`, merged via PR #599 on 2026-08-30, the same day as the prior reconciliation pass — the recommendation and the merge appear to have raced each other).

Direct code read of the merged diff confirms the predicted risk materialized exactly as Gate B described it *before* it shipped: the new `capturePurchaseCompleted` call in `src/lib/trpc/routes/general/orders.ts` fires whenever `createdOrders.length > 0`, using `input.totalAmount`/`input.totalItems`/`input.items` — the full checkout's intended totals — not the subset that actually succeeded. **Every partial-failure checkout since 2026-08-30 has been overstating its `purchase_completed` value/item-count in PostHog, not just hypothetically.** This is now folded into REN-144's SPEC as REQ-008/INV-006/SCN-012 (see `docs/.work-items/REN-144/SPEC.md`) rather than tracked as a new, separate finding — it is a direct, foreseeable consequence of REN-144 remaining unimplemented, not an independent defect.

## REN-143, REN-133, REN-95, P01/P02 call-site count

Re-verified this pass, all **unchanged** from the 2026-08-30 pass:
- REN-143: Linear still says "Deployed to Prod"; `work-item.yaml` still says `task.status: IN_REVIEW` with unfilled evidence placeholders. Discrepancy persists.
- REN-133: still `Backlog`, `Medium`, assigned — scope confirmed narrow (client-side helper extraction only).
- P01/P02 live-call-site count: not independently re-walked line-by-line this pass (the 2026-08-30 correction — 5 files/6 sites, `getEmbedding768` live not dead — was accepted as-is; no commit touched those files between the two passes per `git log --since`).
- No commit on `origin/master` since 2026-08-29 touches any of `src/lib/delhivery/orders.ts`, `src/lib/trpc/routes/general/orders.ts` (except REN-131's diff), `src/lib/db/queries/product.ts`, `src/lib/support/cancel-order-helper.ts`, `src/app/api/permission/route.ts`, or `src/lib/trpc/routes/brands/brands.ts` other than the REN-131 change already accounted for above — so DEF-009/010/002/003's underlying code defects are confirmed still live and unchanged.

## Confirmation
"Remote Git was checked." "Live Linear was checked." Both directly, this session — not recalled from the 2026-08-30 pass's record.
