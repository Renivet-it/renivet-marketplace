# REN-109 Specification

## Goal

Give `/mycart` a cart-specific browser title while preserving the existing site-name suffix and all cart behavior.

## Evidence and scope

- Linear reports `/mycart` currently displays `Profile | Renivet`.
- `src/app/(protected)/mycart/page.tsx` declares the metadata default as `Profile` with the shared `%s | Renivet` template.
- Scope is limited to route metadata and regression coverage. Do not change checkout, authentication, navigation, or other route titles.

## Acceptance criteria

- `/mycart` reports `Cart | Renivet` in the browser tab for both authenticated and guest cart renders.
- The existing site-name template remains intact.
- No other route metadata or cart behavior changes.
- A metadata regression check covers the route default and title template.

## Decision

Change the cart page metadata default from `Profile` to `Cart`; retain the existing site-name template.
