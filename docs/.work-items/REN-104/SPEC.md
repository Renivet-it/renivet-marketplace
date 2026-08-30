# REN-104 Specification

## Goal

Add App Router loading and error recovery boundaries to the highest-risk customer purchase route segments so checkout, payment, and order failures render a recoverable user state instead of an unhandled blank/error response.

## Evidence and scope

- Linear reports no `error.tsx`, `loading.tsx`, or `global-error.tsx` under `src/app`; only `not-found.tsx` exists.
- The checkout route is server-rendered and delegates interactive purchase/payment behavior to `checkout-content.tsx`.
- The protected orders segment already has a layout, while the cart route contains payment and checkout steps.
- Scope is the first route-boundary slice with exact files: `src/app/global-error.tsx`; `src/app/(protected)/checkout/loading.tsx` and `error.tsx`; `src/app/(protected)/mycart/loading.tsx` and `error.tsx`; and `src/app/(protected)/orders/loading.tsx` and `error.tsx`. API/webhook handler error normalization, transaction semantics, and payment-provider redesign are separate work.

## Acceptance criteria

- Root-level render failures have a `global-error.tsx` recovery UI with a reset/reload action and safe user-facing copy.
- Checkout, cart/payment, and orders segments have loading UI and recoverable error UI with `reset()`.
- Boundary UI does not expose exception details, payment data, addresses, tokens, or server secrets.
- Loading states preserve the existing storefront shell and avoid misleading success/payment states.
- Error recovery logs only a stable boundary marker, route segment, and Next error digest through the repository's existing `console.error` convention; it must not log the raw exception or request/payment data. Logging failure cannot prevent fallback rendering.
- Boundary tests in `tests/ren-104-boundaries.test.ts` cover initial loading, render failure, reset, safe copy, redacted logging, and unchanged API/webhook scope.

## Decision

Implement the exact bounded App Router boundary slice above. `global-error.tsx` must render its own `<html>` and `<body>`; segment boundaries cover page/content failures but not failures in the segment layout itself. Do not auto-retry in-flight payment/order mutations: the fallback offers explicit reset/navigation only, and the existing server/payment state remains authoritative. Keep API/webhook resilience explicitly out of this UI-boundary change.
