# REN-130 Specification

## Goal

Restore PostHog visibility for the live phone-first sign-in and sign-up funnel by emitting the established authentication events at the correct user actions without changing Clerk authentication behavior.

## Evidence and scope

- `phone-first-sign-in.tsx` and `phone-first-sign-up.tsx` contain Clerk flows but no PostHog calls.
- `POSTHOG_EVENTS.AUTH` already defines `SIGNIN_INITIATED` and `SIGNED_IN`; the issue permits equivalent signup-specific events if chosen consistently.
- Scope is client analytics instrumentation in the live forms, event payload design, and regression tests. Clerk methods, redirects, legal acceptance, and error handling are out of scope.

## Acceptance criteria

- Sign-in and sign-up initiation and successful completion emit one documented event each at the corresponding user action.
- Events are emitted for phone, email, verification, and Google flows where the lifecycle reaches that state, without duplicate emissions from rerenders or retries.
- Event properties contain only approved, non-sensitive funnel metadata; phone numbers, passwords, verification codes, and tokens are never sent.
- Auth success and redirect behavior remain unchanged if PostHog is unavailable.

