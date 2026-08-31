# REN-111 Specification

## Goal

Make guest entry into Corporate Orders and Become a Seller preserve the intended destination through the repository's custom sign-in flow, while retaining authentication and preventing unsafe redirect targets.

## Evidence

- Linear REN-111 is a Medium-priority `qa-finding` in Backlog, in project `Guest Journey QA Findings`; it has no comments or relations.
- The Linear issue cites `tests/JOURNEYS.md` journeys 9c and 10, but that file is not present in this checkout.
- `src/config/site.ts:106-112` exposes `/become-a-seller` and `/profile/corporate` in the footer.
- `src/middleware.ts:276-282` sends unauthenticated `/profile` and `/become-a-seller` requests to bare `/auth/signin`.
- `src/app/(marketing)/corporate-orders/page.tsx:13-17` preserves `/corporate-orders` in `redirect_url`.
- `src/app/(home)/become-a-seller/page.tsx:52-54,73` redirects unauthenticated users to bare `/auth/signin`.
- `src/components/auth/phone-first-sign-in.tsx:102-118,208-332` owns the custom phone/email sign-in and sign-up completion, and `:117`/`:132` always navigates to `/`.
- `src/app/(protected)/profile/corporate/page.tsx:7-11` and related corporate routes already establish destination-specific redirect conventions.

## Scope and design

The implementation contract is to establish one canonical, validated post-auth destination flow for these guest entry points. It must cover both middleware and server-component auth guards, preserve the intended internal path across phone sign-in, email sign-in, phone sign-up, email verification, and Google sign-in, and keep authenticated users on the normal route. Redirect state must be constrained to same-origin application paths; arbitrary external URLs must not be accepted.

Decision recorded: Become a Seller remains login-gated for this task. The current authenticated Seller form is preserved; a public Seller landing page is out of scope and should be handled separately.

Decision recorded: Redirect preservation will use one shared mechanism for existing internal `redirect_url` callers, including cart, Corporate Orders, Seller, and future login walls.

Decision recorded: Missing, malformed, external, and protocol-relative redirect values fall back to `/` to prevent open redirects.

Decision recorded: Google SSO must restore the validated destination through the existing `/auth/sso-callback` route. No Clerk provider configuration change is required; the application supplies the already validated destination as Clerk's completion target.

## Acceptance

- A guest entering each in-scope footer destination is sent to sign-in with its intended internal destination preserved.
- Successful phone, email, verification, sign-up, and Google authentication return to the preserved destination; absent or invalid destinations fall back safely to `/`.
- Existing authentication enforcement remains intact for Seller and Corporate Orders.
- External/open-redirect destinations are rejected.
- Existing cart redirect behavior remains compatible, including `/mycart`.
- Focused regression coverage verifies route construction, destination validation, completion behavior, and both guest entry points.
- No database, payment, order, inventory, or external-provider behavior changes.

## Exclusions

- No public Seller landing page, anonymous brand-request submission, or change to Seller eligibility rules.
- No change to corporate order authorization or order-processing APIs.
- No broad auth-provider migration or database/schema work.
- `tests/JOURNEYS.md` could not be inspected because it is absent from this checkout; the Linear description is the source for the cited journey intent.

## Independent Critic result

The fresh-context, read-only Critic review is recorded in `CRITIQUE.md`. Its supported findings were reconciled into the approved contract: the resolver validates raw and encoded unsafe values, Google uses the existing callback with a validated completion target, and all existing internal redirect callers use the same destination convention.
