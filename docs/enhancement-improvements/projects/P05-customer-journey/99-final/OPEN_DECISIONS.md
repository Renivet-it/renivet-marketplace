# Open Decisions — P05 Customer Journey & UX

## Already tracked (not restated in full)
REN-95's 6 unresolved product/security/finance decisions — see `docs/enhancement-improvements/07-decisions/DECISION_QUEUE.md`, row `DECISION-P05-001` through `006`. The individual decisions themselves are not enumerated in that file or re-derived in this pass (they live in `docs/.work-items/`'s SPEC governance pilot run, not opened here) — **this is itself a gap**: whoever picks up REN-95 next should locate and read that pilot run's actual decision list, not assume this package has it.

## New DECISION REQUIRED items surfaced by this pass

1. **REN-144 architecture choice**: keep the current capture-then-order sequence and harden it with a transaction + reconciliation record (V1, recommended), or move to an order-then-pay sequence (V2 candidate, `07-feasibility/ALTERNATIVES.md` Alternative A)? Owner: engineering + product architecture review.
2. **REN-144 webhook ownership**: should the Razorpay webhook become the authoritative order-finalization trigger (Alternative B), or remain a secondary/audit signal alongside the client-driven path? Requires opening and evaluating the webhook handlers, not done in this pass (FR-1.5).
3. **REN-144 order-creation granularity**: is per-line-item order creation (as found, rather than per-brand as originally scoped) intentional — e.g., to allow independent per-item fulfillment/cancellation — or should it be per-brand? This changes what "atomic" means for the transaction-boundary fix (BRule-2).
4. **REN-152 consolidation scope**: should the profile checkout modal (the newly-found 3rd duplicate surface) be included in REN-152's remediation scope, not just the two page-level checkout flows?
5. **REN-161 actual business rule**: is TRYNEW20 meant to be new-customer-gated (requiring real server-side enforcement to be added) or is it a generic cart-value threshold promo that should simply be renamed/recopied to stop implying new-customer exclusivity? Requires reading `coupons.validateCoupon`'s server-side logic (FR-5.1), not done in this pass.
6. **REN-95 interim mitigation**: should `/checkout`'s guest treatment be changed to match `/mycart`'s (show a guest view instead of hard-redirecting) as a stopgap before the full three-layer fix ships, given both surfaces already treat guests inconsistently today (REN-111)?
7. **Existing partial-order data cleanup**: should a one-time production data audit for already-orphaned/partial order rows be run before or alongside the REN-144 code fix, given this pass found the defect is structural rather than hypothetical? (`08-reliability/RECOVERY_ROLLBACK.md`)
