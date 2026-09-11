# Personas — P02

Personas are **INFERRED** from the product surfaces observed in code (no user research artifacts were found in the repository). Used to frame user stories, not as validated research.

## P1 — Returning shopper with cart items ("Priya, the cart cross-sell audience")

Adds 2-3 items to cart, sees "Complete Your Conscious Wardrobe" suggestions. Cares about: relevant, in-stock, reasonably priced suggestions that don't feel random; a working page even if a backend service is degraded. Directly affected by REN-147 (silent disappearance) and REN-157 (copy accuracy).

## P2 — Browsing shopper on a product page ("Arjun, the PDP browser")

Views a product, sees "You May Like" carousel. Cares about: suggestions that are visually/stylistically close to what he's looking at (this already works reasonably well via single-item similarity — the gap is copy overclaiming a stronger signal, not the underlying result quality). Affected by REN-157.

## P3 — Signed-in repeat shopper landing on `/shop` ("Meera, the personalized-sort recipient")

Has order/browsing/wishlist history; lands on the shop page and expects "Recommended" (the default sort) to reflect that history meaningfully. Currently gets a binary "in my history-derived set or not" bucketing rather than a true rank. Affected by REN-150.

## P4 — Post-purchase shopper (SPECULATIVE — REN-165 territory)

A shopper who just completed checkout. Whether this persona's moment-of-purchase is a good place to introduce recommendations is the open question REN-165 exists to verify. **Not assumed as validated** — no story in `USER_STORIES.md` treats this persona's needs as confirmed.

## P5 — Merchandiser/business stakeholder (indirect, non-UI persona)

Not a shopper-facing persona, but relevant to BR-3/BR-4: cares whether "AI-powered" claims in shopper-facing copy are defensible, and whether recommendation infrastructure cost (repeated ML calls, DB scoring) scales sensibly with traffic. Affected by REN-157 and REN-160 respectively.
