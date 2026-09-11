Exit code: 0
Wall time: 0.2 seconds
Output:
# REN-162 Specification

## Goal

Capture product-card click events from the active homepage product surfaces so recommendation browsing history receives the same click signal already captured by the shop grid.

## Evidence and scope

- Linear REN-162 is a Medium-priority backlog task with no comments, blockers, or dependencies.
- `src/components/shop/shop-products.tsx` already sends `{ productId, brandId }` to `/api/products/track-click` through `navigator.sendBeacon`, with a `fetch(..., keepalive: true)` fallback.
- The search-result path uses that same `ShopProducts` component, so search-result click capture is already present in the current repository and is not a new implementation target.
- The active homepage composition in `src/app/(home)/page.tsx` mounts product-card surfaces including new arrivals, swap-space, products-under-999, and may-also-love sections. Their product-detail links do not currently invoke the click-tracking transport.
- The existing endpoint authenticates server-side and records the event through `productQueries.trackProductClick`; no schema or API change is required.
- Scope is wiring the existing click event to active homepage product-detail links, preferably through one shared client-safe transport helper used by the existing shop handler and homepage consumers. Recommendation weights, event names, payload shape, endpoint authorization, cart/wishlist actions, and unrelated campaign routes are excluded.

## Requirements

- Record one product click for a customer activation of an active homepage product-detail card, using the existing product and brand identifiers.
- Cover the active homepage product-card surfaces mounted by the root homepage, including new arrivals, swap-space, products-under-999, and may-also-love cards where product-detail links are rendered.
- Preserve the existing shop-grid/search-result click behavior and reuse its beacon/fetch-keepalive transport semantics.
- Do not track quick-add, buy-now, wishlist, share, carousel, pagination, or non-product promotional link actions as product-card clicks.
- Keep tracking failure-isolated: a beacon/fetch failure must not prevent navigation or interrupt cart/wishlist behavior.
- Avoid duplicate events for one product-detail activation, including cards with separate image and text links.

## Acceptance criteria

- Clicking a homepage product card records a `productEvents` row with event `click`, the cardâ€™s product ID, brand ID, and authenticated user when available.
- The active homepage product surfaces listed above all use the existing tracking transport.
- Search-grid tracking remains intact and one user activation does not produce duplicate click rows.
- Product navigation, add-to-cart, buy-now, wishlist, share, and carousel interactions retain their current behavior.
- Tracking failures are non-blocking and do not surface as customer-facing navigation errors.

## Approved implementation policy

The preferred design is a small shared browser transport helper that centralizes the existing beacon plus keepalive fallback, then attaches it only to product-detail links. It must not change the server endpoint or persistence contract.



