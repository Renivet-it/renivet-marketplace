# Integrations — P06

## PostHog
- **Client**: `posthog-js` via `posthog-js/react`'s `usePostHog()`. Used in page views, identify bridge, add-to-cart hook, purchase-completion handlers.
- **Server**: `posthog-node`, instantiated once in `src/lib/posthog/client.tsx` (misnamed, REN-134), used in tRPC route handlers (`cart.ts`, `wishlist.ts`).
- **Config**: `env.NEXT_PUBLIC_POSTHOG_KEY` / `env.NEXT_PUBLIC_POSTHOG_HOST` — a `NEXT_PUBLIC_` key used for the server client too, meaning project key is shared between client and server SDKs (normal for PostHog, not a defect).

## Meta (Facebook) Pixel + Conversions API
- **Pixel (client)**: `src/lib/fbpixel`, wrapped as `fbEvent()`. Pixel ID resolved from `process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID` with a hardcoded fallback (`"618442627790500"`) in `src/lib/fb-capi.ts` — flagged as a minor config-hygiene concern (hardcoded fallback ID), not in scope to fix here but noted in `11-critique`.
- **CAPI (server)**: `facebook-nodejs-business-sdk`, wrapped as `sendCapiEvent()` in `src/lib/fb-capi.ts`. Requires `env.FACEBOOK_CAPI_ACCESS_TOKEN`; if absent, CAPI calls are skipped with a console warning (graceful degradation, already correct).
- **Dedup**: shared `eventId` (client-generated `crypto.randomUUID()`) passed to both Pixel and CAPI calls for the same logical event — this is Meta's documented dedup mechanism and appears correctly wired.
- **Gating**: `shouldRunExternalSideEffects()` — an existing feature-flag-style gate that can disable all external side effects (including CAPI) e.g. in non-prod environments.
- **Audit**: every CAPI attempt (success or failure) is logged to the `capiLogs` table (`src/lib/db/schema/capi-logs.ts`), viewable via `src/app/(protected)/dashboard/capi-logs/page.tsx`.

## GA4 — not integrated
No GA4/`gtag` integration exists in `src/`. If DECISION-P06-001 approves adding one, it would be a new integration, not a fix to an existing broken one — scope accordingly in V2/V3 planning (`10-roadmap/`).

## Windsor.ai
Not part of the application's runtime integrations — used externally by the growth-audit data pull (`docs/growth-audits/2026-08-23/`) to blend Meta Ads, PostHog, and GA4 data for reporting. Not a system this Epic's engineering scope touches directly.

## Clerk (identity)
`useUser()` (client) / `currentUser()` (server) from `@clerk/nextjs` is the identity source feeding PostHog's `identify()` call and CAPI's user-data enrichment (email/phone/name, plus DB-sourced address fields). Identity resolution correctness (REN-128) depends on Clerk's session state being accurate — already shipped and out of this pass's re-verification scope beyond confirming the code exists.
