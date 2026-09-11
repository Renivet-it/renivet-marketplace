# Performance — P05 Customer Journey & UX

## Current state
No performance issue was identified as a defect in this pass — the checkout flow's client-side computation (`useMemo`-based price/tax/availability calculation) is standard React patterns and was not flagged as slow by any evidence gathered. Performance is included here primarily as a constraint on the REN-144 fix, not as an independent finding.

## Constraint on REN-144's transaction-boundary fix
Wrapping multi-brand, multi-item order creation in a single `db.transaction()` serializes what is currently a loop of independent (if unsafely independent) writes. For the common case (1 brand, few items) this is a negligible change. For a large multi-brand cart, transaction duration scales with the number of order/orderItems inserts plus any tax/HSN lookups performed inside the loop (`ctx.queries.financeCompliance.listHsnMaster()`, called once per checkout — CONFIRMED — not per item, so this itself is not a new scaling concern). See NFR-4 for the target bound (<200ms added for the common case).

## Constraint on cart availability (REN-153)
Evaluating the same availability predicate in the cart view in addition to checkout means running the filter twice per checkout journey instead of once. This is a cheap in-memory filter over already-fetched cart data (no additional network round-trip implied, assuming the cart view already has the product fields the predicate needs from `getCartForUser`) — expected to be a non-issue, but should be confirmed the cart's existing query response includes all the fields the predicate needs (`isPublished`, `verificationStatus`, `isDeleted`, `isAvailable`, `quantity`, `isActive`, variant fields) without requiring a new query.

## Not applicable
No caching, indexing, or query-optimization defect was found in the scope investigated for this Epic.
