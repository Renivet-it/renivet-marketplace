# REN-144 Controlled Iteration Report — 2026-09-01

## Fresh state verified
- `git fetch --all --prune` + `git ls-remote`: `origin/master` HEAD unchanged at `0423b6be32340155d480aa5fc49d3f88eeff1523`. `git log --since` confirmed zero new commits touching any REN-144-relevant file since the last pass.
- Live Linear: REN-144 unchanged (Backlog, Urgent). Comment thread checked — no reply to the DEC-001 question posted in the prior pass. REN-131 unchanged (Deployed to Prod). New related-issue link surfaced (REN-152, checkout-consolidation) — pre-existing, already correctly out-of-scope per REN-144's own description; not new information requiring action.
- Read `docs/.work-items/REN-144/SPEC.md` and `work-item.yaml` in full (not trusted from memory).

## Blockers found (as of start of this iteration)
1. **DEC-001** (open decision): does a manual/admin-side reconciliation process for orphaned orders already exist outside the codebase? — **Genuinely requires Product/Operations/Human input.** Cannot be resolved by code investigation; a human process leaves no source trace.
2. Three `DESIGN_BLOCKER` dependencies from the prior Critic Cycle 3, all developer/design-level:
   - Webhook lookup cardinality (singular `findFirst` vs. many order rows per payment)
   - Stock-update error-swallowing (two layers, one sharper than previously documented)
   - Idempotency key requiring schema changes on `orders`/`orderItems`
3. One `IMPLEMENTATION_PREREQUISITE` (REN-131 re-patch) — not a design blocker, correctly tracked as implementation-time work.

## What was changed
All three developer-level blockers were resolved as concrete engineering decisions, in two revision passes with independent Critic verification between them:

**Revision 3:**
- REQ-007: switched webhook lookup from singular `findFirst` to plural `findMany` keyed on `orders.paymentId`, looping reconciliation across every sibling order row for a payment.
- REQ-009: found `orders.paymentId` already exists and is already correctly populated with the Razorpay payment id; specified a new `orderItems.paymentId` column + a single unique constraint on `(paymentId, productId, variantId)`.
- REQ-010: specified both required fixes for the stock-update swallow points, including a sharper finding — a `WHERE quantity >= N`-guarded UPDATE returning zero rows is not a thrown exception in this codebase's query pattern, so an explicit falsy-result check is required, not just a try/catch fix.

**Critic Cycle 4** (isolated, fresh-context, verified against `origin/master`) confirmed REQ-010 fully resolved, but found two further gaps in REQ-007 and REQ-009:
- REQ-009's single unique constraint would silently fail to protect non-variant products (`variantId` is nullable; Postgres NULL-vs-NULL non-equality defeats a combined constraint for the common case).
- REQ-007's plural lookup would break the webhook's existing stock-insufficiency refund branch, firing N duplicate refund calls under a naive loop.

**Revision 4** fixed both: two partial unique indexes for REQ-009 (variant / non-variant products, both correctly exempting null-payment COD/reward orders); and, for REQ-007, recognized the refund branch is itself a "fulfillment side effect" already covered by REQ-007's own reconciliation-only scope — skipped entirely for a Phase-1-committed order rather than rebuilt as pooled multi-row refund logic (simpler, consistent with this program's Reuse-over-new-mechanism preference).

All 3 `DESIGN_BLOCKER` dependencies are now `status: resolved` in `work-item.yaml`. All historical Cycle 1/2/3 critic findings whose justification text already said "RESOLVED" but whose `blocking` flag was never flipped were individually corrected to `blocking: false`, so the deterministic validator now reports **zero blocking critic findings** — an accuracy fix, not a new resolution.

REN-131's special-attention item was explicitly re-checked: REQ-008/INV-006/SCN-012 (present since the original draft, requiring `capturePurchaseCompleted`'s amounts/items to derive from `createdOrders` not `input`) remain correct and unaffected by this iteration's per-item idempotency/webhook changes.

## Deterministic validation
`node validate-work-item.ts docs/.work-items/REN-144/work-item.yaml` → **PASS**. Exactly one item blocks reaching `APPROVED`: DEC-001 (open decision). One `IMPLEMENTATION_PREREQUISITE` remains unresolved (REN-131 re-patch) but does not gate `CRITIQUE`/approval, only `READY_FOR_PR`.

## REN-144 status: still BLOCKED, not APPROVED
Per explicit instruction, REN-144 is **not** marked `APPROVED` — one governance gate (no open decisions) is not satisfied, and marking it approved anyway would be asserting a false governance state.

## Exact next action
Either:
(a) Get Product/Support to answer DEC-001 (does a manual reconciliation process already exist?), then run one more Critic cycle specifically on Revision 4's two mid-review corrections (not yet independently verified) before Approval, **or**
(b) If DEC-001 is deferred, no further SPEC work should proceed past Critique — implementation must not start while an open decision remains, per this program's own governance rule.

## Human decision required
**DEC-001** — Does a manual/admin-side reconciliation process for orphaned/partial orders already exist today outside the codebase (a support runbook, an admin panel action)?
- **Why required:** Not derivable from source; REN-144's own Linear description names this as an explicit precondition.
- **Options:** (1) No such process exists — build the new automated reconciliation sweep as net-new (current SPEC assumption). (2) A manual process exists — integrate rather than duplicate.
- **What's blocked:** REN-144 cannot reach `APPROVED`/`READY_FOR_DEV` while this is open; implementation should not start until resolved.
