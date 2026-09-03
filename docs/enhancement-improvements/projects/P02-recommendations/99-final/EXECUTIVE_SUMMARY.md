# Executive Summary — P02 Recommendations & Personalization

## What we found

Renivet's three recommendation surfaces (cart cross-sell, PDP similar-products, shop-page "Recommended" sort) work, but each has a confirmed, narrow defect that undercuts what they claim or compute:

- **Cart cross-sell's safety net isn't one.** Its "fallback," meant to protect against the external similarity service failing, calls a different endpoint on the *same* server. If that one server goes down, the whole cross-sell panel silently vanishes — no error, no generic suggestions, nothing (REN-147). We also found the fallback couldn't be redirected via configuration even if someone tried — the environment variable meant to control it is dead code.
- **The shop page throws away work it already did.** It computes a genuine, ranked, per-shopper personalization list, then only uses "is this product on the list" (yes/no) to influence order — discarding the actual rank (REN-150). The code comment describing this logic even claims it does something it doesn't.
- **The copy overpromises.** Cart and product-page suggestions both come from the identical single-item similarity lookup — there's no "goes well together" or "frequently bought together" logic anywhere — but the copy ("AI-powered similarity," "Complements your style," "Pairs well") implies otherwise (REN-157).
- **Nothing is cached.** Every view recomputes from scratch — repeated external calls, repeated multi-query database scoring — with no cache anywhere in the path (REN-160).

The one genuinely good news finding: the product page already has a working, independent fallback pattern (same-brand → same-category → best-sellers, no dependency on the fragile external service) that the cart page simply never got. Fixing cart cross-sell is largely a matter of copying a pattern that already works elsewhere in this same codebase.

## What we're NOT recommending

- Building a "frequently bought together" feature (REN-168) — deferred by design, gated on demonstrated business need we don't yet have.
- Building a post-purchase recommendation page (REN-165) — this is flagged as a *possible* opportunity in two audit rounds, not a confirmed one; we recommend a cheap verification step before any build decision.
- Any bigger architectural rebuild — every fix reuses patterns and infrastructure already present in the codebase.

## Bottom line

Four small, independently shippable fixes close real, verified defects at low engineering cost and low risk. Two items are correctly held back — one pending a cheap verification step, one pending real evidence of business need.
