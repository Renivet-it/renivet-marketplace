# P05 — Customer Journey & UX — Implementation Reconciliation

## Finding: no implementation exists to reconcile — including REN-144

`git diff --stat` between the SRS baseline (`b2b35fb7`) and current `origin/master` (`4943c40a`), scoped to `src/lib/trpc/routes/general/orders.ts`, `src/lib/razorpay/payment.ts`, `src/app/(protected)/checkout/`, `src/app/(protected)/mycart/`, and every other path the P05 SRS package (`docs/enhancement-improvements/projects/P05-customer-journey/`) names as relevant, returns **empty**. No work-item exists for REN-95, REN-108–112, REN-144, REN-152, REN-153, REN-161, or REN-163 on `origin/master`. No branch or open PR touches this scope.

## This is the most consequential MISSING finding in the whole reconciliation

**REN-144 (payment/order integrity, P0/Urgent) remains completely unimplemented.** The fail-open catch-and-continue behavior the P05 SRS package documented — a partial order-creation failure after a captured payment is still shown to the customer as "Order Placed Successfully" — is unchanged in the live codebase as of `origin/master` HEAD. This is not a regression introduced by this reconciliation pass; it is the pre-existing, already-fully-specified defect, confirmed still present.

## Reconciliation matrix

| Item | Linear | SRS requirement | Current code | Status | Gap | Risk |
|---|---|---|---|---|---|---|
| REN-144 (payment/order integrity) | REN-144 | Durable reconciliation record + fix the catch-and-continue fail-open behavior; explicitly NOT just a `db.transaction` wrapper | Unchanged — `createOrder` still loops per line item with the same try/catch that logs and continues, per the SRS's own code citation | **MISSING** | Full implementation | **Live, P0, ongoing** — every day this is unimplemented, a partial-payment/partial-order event can still occur in production |
| REN-95 (checkout login wall) | REN-95 | 3-layer fix, blocked on 6 undocumented decisions | Unchanged | **MISSING** | Full implementation + the decision-enumeration gap the SRS itself flagged | None new |
| REN-108–112 (Guest Journey findings) | REN-108–112 | Various UI/consistency fixes | Unchanged | **MISSING** (all 5) | Full implementation | None new |
| REN-152 (duplicate checkout implementations) | REN-152 | Consolidate; SRS found a 3rd surface (profile checkout modal) with copy-pasted TRYNEW20 logic | Unchanged | **MISSING** | Full implementation | None new |
| REN-153 (cart availability) | REN-153 | Add availability badge to cart view | Unchanged | **MISSING** | Full implementation | None new |
| REN-161 (TRYNEW20 disclosure) | REN-161 | Add disclosure copy | Unchanged | **MISSING** | Full implementation | None new |
| REN-163 (payment-cancel redirect) | REN-163 | Redirect to originating context, not always `/mycart` | Unchanged | **MISSING** | Full implementation | None new |

## Section 7 checks, answered directly

- **"Order Placed Successfully" must never be shown on incomplete order creation:** currently **VIOLATED in production** (this is the pre-existing defect the SRS documents, not something this reconciliation introduces) — confirmed still true by the empty diff.
- **Solution must not be reduced to a simple DB transaction wrapper:** not yet testable — no implementation exists. Flag for the next pass: when REN-144 code appears, verify it includes a durable reconciliation record (not just a transaction boundary), per the P05 SRS's explicit finding that a browser/process termination between capture and order creation can occur regardless of transaction boundaries.
- **No distributed saga framework unless SRS explicitly supports it:** the SRS explicitly does NOT support one (rejected in `11-critique/ANTI_OVERENGINEERING_REVIEW.md`) — nothing to check yet since no implementation exists, but this is the standard to hold any future implementation to.

## Final decision

**BLOCK is not applicable** (nothing to block — there is no PR). The correct framing is: **REN-144 remains an open, live, P0 production risk with zero implementation progress since the SRS package was written.** This should be surfaced as the single highest-priority item across the entire reconciliation, independent of anything else found in P01/P02/P06/P08.
