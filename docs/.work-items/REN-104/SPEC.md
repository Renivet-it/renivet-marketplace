# REN-104 Specification

## Goal

Provide production-safe App Router loading and error recovery for root, checkout, cart/payment, and order failures without exposing technical details or automatically replaying application startup or purchase mutations.

## Evidence and scope

- Linear reports that the application originally had no route-level loading/error boundaries.
- Root remounts can run `MergeGuestCart` and `MergeGuestWishlist`; the cart merge increments existing quantities and is not idempotent. Global recovery therefore must not reset or reload automatically.
- Global fallback code must remain independent of storefront navigation, authentication, payment, and provider component graphs so it can survive a root dependency failure.
- Allowed files are the root and named segment boundary files plus their dedicated/shared support: `src/app/global-error.tsx`; checkout, mycart, and orders `loading.tsx`/`error.tsx`; `src/components/globals/errors/global-error-recovery.tsx`; `src/components/globals/errors/route-error-boundary.tsx`; `src/components/globals/layouts/storefront-loading-shell.tsx`; `src/lib/route-error.ts`; and `tests/ren-104-boundaries.test.ts`.
- API/webhook error normalization, payment transaction semantics, guest-merge idempotency changes, schemas, and provider redesign remain outside scope.

## Acceptance criteria

- Root failures render a minimal, dependency-light fallback with neutral copy and a working `Try again` action that performs a full-page browser reload only after the customer clicks it.
- Checkout, cart/payment, and orders retain localized loading/error UI; their manual `Try again` action invokes the App Router `reset()` callback and never reloads or retries automatically.
- No recovery path schedules an automatic reset/reload or invokes cart, payment, order, inventory, wishlist, or guest-merge mutations.
- Customer output contains no raw exception, stack, address, credential, token, or provider payload.
- Boundary logging is best-effort: it emits only marker, segment, and digest, and a throwing logging sink cannot break the fallback.
- Tests cover the distinct `global-reload` and `localized-reset` modes, absence of automatic timers, full-page root reload, localized reset, root `<html>/<body>` requirements, safe copy, logging redaction/failure isolation, and unchanged API/webhook scope.

## Decision

Use two explicit recovery modes. The root `global-error.tsx` renders a standalone minimal component and uses customer-initiated full-page reload. Localized purchase boundaries use the shared storefront component and customer-initiated App Router reset. Automatic reload/reset is prohibited because a root remount can replay the non-idempotent guest-cart merge and duplicate quantities. Existing server/payment state remains authoritative.
