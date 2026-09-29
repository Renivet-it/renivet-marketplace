# REN-245 Engineering Specification

## Scope

**Linear:** REN-245 — Improve grievance submission, identity matching, and customer grievance portal  
**Branch:** `ayanganguly333/ren-245-improve-grievance-submission-identity-matching-and-customer`  
**Risk:** L3 — customer identity matching, account creation, support-ticket ownership, and sensitive grievance data

REN-245 improves the existing grievance intake while reusing the existing customer support ticket/message model. It adds strict server/client validation, authenticated customer prefill, a dedicated My Grievances experience, and safe guest identity resolution without account merging or ticket disclosure.

## Repository evidence

- `src/lib/trpc/routes/general/legal.ts` exposes public `submitGrievance` with name/email/order/category/description, but no phone, shared validation schema, normalization, account matching, or consent gate.
- `src/app/(home)/contact/page.tsx` renders the public grievance form and currently has no phone field or field-level validation state.
- `src/lib/db/schema/ticket.ts` stores `userSupportTickets.userId`, `orderId`, `intakeContext`, SLA fields, and message history; there is no separate guest claim table.
- `src/lib/trpc/routes/general/user-support.ts` already provides protected `listMyTickets`, `getTicket`, `getMessages`, and `sendMessage`, with ownership checks against `ctx.user.id`.
- Help Center pages/components already provide authenticated support history, detail, and replies, but profile navigation has no dedicated My Grievances item.
- Users have unique email/phone fields and verification flags; Clerk webhooks synchronize authenticated Clerk users. Existing phone-first sign-up/sign-in and verification components provide reusable auth primitives.

Production data, raw account enumeration, and external account mutation are excluded from SPEC.

## Design boundary

1. Create a shared grievance input schema/normalizer used by the public UI and mutation: required name, phone, email, category, description, optional order ID; Indian phone normalized to exactly 10 digits; email trimmed/lowercased and shared-validated.
2. Repeat validation/normalization server-side before lookup or insert. Preserve category, order, description, high priority, 48-hour acknowledgment SLA, audit, and operational-alert behavior.
3. Authenticated users see known email/phone prefilled. Values remain editable through an explicit edit action; edited values are validated and do not silently update the profile.
4. Reuse protected support queries/replies and add a grievance-filtered customer page/menu entry. All ticket operations remain ownership-scoped.
5. Guests are matched server-side by normalized phone/email. Exactly one account links the grievance; phone/email conflict never merges or guesses. Responses must not enumerate account existence.
6. No-match account creation requires explicit consent and a secure Clerk verification/sign-in handoff. No password, raw token, or credential is stored in ticket data.
7. Preserve admin grievance queue, SLA timers, audit events, alerts, and protected intake context.

## Proposed guest access flow (requires confirmation)

Use the existing Clerk phone/email verification flow with an opaque, short-lived, server-side pending-grievance claim. Consume it once after verified sign-in/sign-up and then expose the grievance to the authenticated owner. Never place ticket IDs, account IDs, or authentication secrets in the public response.

## Required evidence before implementation approval

- Validation/normalization and field-level error tests.
- Exactly-one, no-match, conflict, consent, and generic non-enumerating identity tests.
- Ownership/IDOR tests for list, detail, messages, and replies.
- Regression tests for admin queue, SLA, audit, alerts, and existing ticket behavior.
- Integration evidence for the confirmed Clerk verification/access handoff.
