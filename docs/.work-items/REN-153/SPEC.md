# REN-153 Specification

## Goal

Show customers when a cart item is no longer eligible for checkout, directly in `/mycart`, before they begin checkout.

## Evidence and scope

- `src/app/(protected)/mycart/Component/product-cart-card.tsx` renders the cart item in separate mobile and desktop branches and currently has no availability state.
- `src/app/(protected)/checkout/checkout-content.tsx` already filters cart items using publication, approval, deletion, availability, active state, product stock, variant deletion, variant stock, and cart selection.
- `CachedCart` already contains all product and selected-variant fields required by that predicate; no new request or database change is needed.
- Scope is the cart-card display layer and a shared pure availability predicate if needed. Checkout filtering, cart persistence, inventory, and REN-152 checkout consolidation are excluded.

## Requirements

- Reuse the existing checkout eligibility rules to derive whether each cart item is unavailable in the cart view.
- Render a clear unavailable-state badge/message for unavailable items in both mobile and desktop card variants.
- Keep available items visually and behaviorally unchanged.
- Do not add data fetching, alter cart quantities/status, or change checkout-time filtering.
- Keep the display accessible with text understandable without relying on color alone.

## Acceptance criteria

- Marking a product unavailable, unpublished, unapproved, deleted, inactive, or out of stock causes its `/mycart` card to show an unavailable notice.
- A selected unavailable variant is also visibly marked when the variant is deleted or has no stock.
- The notice appears in both responsive card branches.
- Available product and variant cards retain their existing rendering and controls.
- Tests cover each availability reason and regression coverage for available items.

## Approved display policy

This is a display-layer change. The card remains present so the customer can remove it or move it to a wishlist through existing controls; checkout remains responsible for excluding ineligible items.

