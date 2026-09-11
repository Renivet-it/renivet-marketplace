# Recovery & Rollback — P05 Customer Journey & UX

## Recovering an existing partial-order state (REN-144, pre-fix)
No automated recovery mechanism exists today (CONFIRMED absence of any reconciliation job in the code read). Manual recovery today requires: (1) identifying the affected `razorpay_payment_id` (from customer report or Razorpay dashboard), (2) cross-referencing `ordersIntent` and `orders`/`orderItems` tables manually, (3) either manually creating the missing order rows or issuing a Razorpay refund for the uncreated portion. This manual process is out of scope for this documentation pass to design in full, but should be a documented interim support runbook regardless of when the code fix ships — flagged as a DECISION REQUIRED / immediate-action item independent of the roadmap.

## Rollback plan for the REN-144 code fix
Wrapping order creation in `db.transaction()` is additive/behavior-hardening, not a data-migration change, so rollback is a standard code revert with low risk — no schema change is required for the transaction boundary itself. If FR-1.3's reconciliation record requires a new column/table, that migration should be additive (new nullable column or new table) so it can ship ahead of the logic change and be rolled back independently if needed.

## Rollback plan for REN-95 (guest checkout)
Higher risk: relaxing the `orders.userId` NOT NULL constraint (FR-2.3) is a schema change that is harder to cleanly roll back once guest orders exist in production (rolling back the constraint to NOT NULL after real guest orders have been written would require a data migration/backfill decision). This asymmetry (easy to loosen, harder to re-tighten) should be an explicit input to the 6 blocking decisions, not decided unilaterally by whoever implements it.

## Rollback plan for REN-152 consolidation
Standard refactor rollback (revert the commit/PR) as long as the consolidation ships as one atomic change per checkout surface migrated, rather than a long-lived partially-migrated state across surfaces (which would reintroduce exactly the inconsistency REN-152 is meant to fix, temporarily).
