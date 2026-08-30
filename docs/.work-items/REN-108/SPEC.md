# REN-108 Specification

## Goal

Make `/guestWishlist` a complete storefront page by rendering the existing guest wishlist content inside the shared header, navigation, responsive mobile navigation, and legal footer shell.

## Evidence and scope

- Linear reports that `/guestWishlist` currently exposes only the sign-in banner and item grid, without site header/nav/search/cart/logo/footer.
- `src/app/(protected)/guestWishlist/page.tsx` is a client module that renders its content directly and does not use the shell components. `FooterWithLegal` is an async server component backed by legal data services, so it must remain in a server boundary.
- The established cart page shell uses `NavbarHome`, `GeneralShell`, `FooterWithLegal`, and `NavbarMob`.
- Scope is composition of the existing guest wishlist UI with those shared layout components. Keep the shell in the server page/layout and extract the localStorage-driven wishlist state/content into a client child. Include an explicit normalization boundary for the existing guest wishlist storage shapes. Preserve loading, empty state, sign-in CTA, item removal, product links, and guest wishlist semantics.

## Acceptance criteria

- Desktop `/guestWishlist` includes the shared site logo/header, navigation, search, cart/wishlist affordances, content area, and legal footer.
- Mobile `/guestWishlist` includes the responsive mobile navigation and remains usable without horizontal overflow.
- Existing loading, empty, populated, login, remove, and product-navigation behavior is unchanged.
- The shell does not require authentication and does not merge or persist guest wishlist data unexpectedly.
- If legal footer data is unavailable, the route still renders a static legal/navigation fallback or its documented route error boundary; a backend failure must not blank the wishlist content.
- Responsive browser coverage verifies the shell landmarks and existing wishlist states.

## Decision

Use the same storefront shell composition already established by `/mycart`: a server boundary renders `NavbarHome`, `main` with `GeneralShell`, `FooterWithLegal` (with a defined static fallback/error boundary), and `NavbarMob`; a client child owns the current wishlist state/content. Normalize the current stored product shapes at that client boundary without changing item identity or destination behavior.
