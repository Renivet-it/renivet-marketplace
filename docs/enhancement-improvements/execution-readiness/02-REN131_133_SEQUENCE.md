# Gate B — REN-131 / REN-133 / REN-144 Sequence Decision

Re-verified 2026-08-30 against current code (not re-derived from the prior reconciliation's assumptions).

## Corrections to the prior reconciliation's record

1. **REN-133 does have a Linear issue** ("Consolidate duplicate `purchase_completed` instrumentation," Backlog, Medium) — the earlier claim that none existed was wrong. Its actual scope is narrower than assumed: a purely **client-side** consolidation (extract one shared `trackPurchaseCompleted()` helper so `order-payment-page.tsx:321` and `checkout-content.tsx:477` stop drifting), not a server-side dedup mechanism. It has no `docs/.work-items/REN-133/` directory — no formal SPEC yet.
2. **REN-144's actual failure mode is more specific than "catch and continue everywhere."** Current `createOrder` (`src/lib/trpc/routes/general/orders.ts`, ~lines 480–1440): email/notification failures inside the loop are caught-and-swallowed (lines 668–674, 1391–1399 — "log the error but don't fail the mutation"), but an order-creation failure itself throws at the outer catch (line 1434) and aborts the whole mutation **without rolling back orders already inserted in earlier loop iterations.** The real defect is **partial-commit-then-throw**: a customer charged for 3 items can end up with 2 order rows and one orphaned/missing item, while the client only sees the whole mutation fail if *zero* brands succeeded — otherwise it's shown unconditional success and the cart is cleared.

## What REN-131 currently assumes

`docs/.work-items/REN-131/work-item.yaml` (exists on `origin/master` only), `state: APPROVED`. `DEP-131-001` ("order persistence and transaction semantics") is marked `status: resolved` — meaning REN-131's design accepts today's fragile persistence (per-item loop, no transaction, partial-commit-then-throw) as a known, understood dependency, not something to wait on being fixed. Its approved decision (`DEC-131-001`) recommends firing exactly one `purchase_completed` event per checkout, keyed by a stable checkout/order-group identifier — a reasonable analytics-layer design, built on top of whatever order rows happen to exist after today's unreliable process runs. **REN-131 never references REN-133 anywhere in its contract.**

## What REN-144 would change that REN-131 depends on

REN-144's fix requires transaction boundaries around order-row creation, cart-clearing scoped only to items that actually succeeded, and an explicit partial-vs-full-success signal distinct from today's "throw only on total failure." This redefines what "checkout complete" means at the DB level — exactly the authoritative persistence trigger REN-131's `FLOW-131-001` needs to fire against. REN-131's checkout/order-group identifier was designed without that redefinition in view.

## Concrete failure if REN-131 ships before REN-144

REN-131's emission logic fires on `order_persisted`, using `createdOrders` (whichever brands' orders succeeded). Under today's behavior, a customer charged for 3 items who ends up with only 2 order rows would still trigger a `purchase_completed` event under REN-131's "one event per complete checkout" policy — **overstating PostHog conversion/revenue-per-visitor for a checkout that was never fully fulfilled.** This is precisely the risk REN-131's own contract names in its risk section ("purchase and revenue analytics can be materially overstated by duplicate or multi-order semantics") without yet having the fix that prevents it.

## REN-133 vs. REN-131

Keep as a distinct ticket (different layer — REN-133 is client-side instrumentation hygiene, REN-131 is server-side capture/dedup design) but **sequence REN-133 last, and require its eventual `/SPEC` to explicitly reference REN-131's `DEC-131-001`** so the client-side helper doesn't fire uncoordinated with the new server-side event once both exist.

## Decision: safe sequence confirmed

**REN-144 → REN-131 → REN-133.**

1. **REN-144 first.** Non-negotiable — implementing REN-131 against today's persistence behavior means rewriting REN-131's emission logic later anyway, at higher cost than sequencing correctly now.
2. **REN-131 second**, once REN-144's transaction boundary and partial-success signal exist. Its already-approved contract's dedup design (checkout/order-group identifier) should be re-validated against REN-144's actual implementation, not assumed to transfer unchanged.
3. **REN-133 third**, with its `/SPEC` required to cite REN-131's dedup identifier so the client-side helper and server-side event use compatible identity semantics.
