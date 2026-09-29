# REN-245 Grievance Identity and Customer Portal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make grievance intake validate and normalize Indian customer identity, safely resolve guest accounts through a single-use Clerk claim, and expose owned grievances through a dedicated customer portal.

**Architecture:** Keep the existing `user_support_tickets` and `user_support_messages` model. Add a small server-side pending-claim table storing only a hash of the opaque claim token and the normalized submission payload until an authenticated Clerk user consumes it. Centralize grievance validation/normalization, preserve existing SLA/audit/alert behavior, and reuse existing protected support queries for the portal.

**Tech Stack:** Next.js App Router, React, tRPC, Drizzle/PostgreSQL, Clerk, Zod, Bun tests.

**Spec:** `docs/.work-items/REN-245/SPEC.md`

## Global Constraints

- Phone input is required and must normalize to exactly 10 Indian digits.
- Email input is required, trimmed/lowercased, and validated by the grievance shared schema on client and server.
- Guest identity conflicts must never merge, guess, or enumerate accounts.
- Customer grievance reads/replies must enforce `userSupportTickets.userId === ctx.user.id`.
- Existing grievance SLA, admin queue, audit events, alerts, categories, order linkage, and message behavior remain intact.
- Use Bun for tests and scripts; run `bun test` after TypeScript changes.

## Review Focus

- `+91`, `91`, spaces, hyphens, and leading-zero phone inputs must normalize/reject deterministically — owned by Task 1 tests.
- A phone/email pair matching different accounts must not disclose either account — owned by Task 2 tests.
- An expired/replayed claim must not create a second ticket or grant access — owned by Task 2 tests.
- Ticket-ID tampering must return no data and no reply side effect — owned by Task 3 tests.
- Existing admin SLA/audit/alert behavior must remain unchanged — owned by Task 4 regression tests.

---

### Task 1: Shared grievance validation and normalization

**Files:**
- Create: `src/lib/grievance/validation.ts`
- Test: `src/lib/grievance/validation.test.ts`
- Modify: `src/lib/validations/index.ts` only if the shared schema is exported there

**Interfaces:**
- Produces `grievanceSubmissionSchema`, `normalizeIndianGrievancePhone`, and `normalizeGrievanceSubmission` for public UI and server mutation.

- [ ] Write failing tests for valid formats, invalid phone/email, exact field errors, and normalized output.
- [ ] Run the focused test and verify it fails because the new module is missing.
- [ ] Implement the minimal Zod schema and normalizer; accept common Indian `+91`/`91` formatting only when it resolves to exactly 10 digits and reject leading-zero/non-Indian values.
- [ ] Run the focused test and verify it passes.
- [ ] Commit: `feat: add grievance identity validation`

### Task 2: Guest matching and single-use pending claims

**Files:**
- Create: `src/lib/grievance/identity.ts`
- Test: `src/lib/grievance/identity.test.ts`
- Create: `src/lib/db/schema/grievance-claim.ts`
- Modify: `src/lib/db/schema/index.ts`
- Create: `drizzle/<next>_grievance_claims.sql`
- Modify: `src/lib/trpc/routes/general/legal.ts`
- Test: `src/lib/trpc/routes/general/legal.test.ts` or focused service tests

**Interfaces:**
- `resolveGrievanceIdentity({ email, phone, findUsers })` returns `exact_match`, `conflict`, or `none` without returning account existence to public callers.
- Claim store persists token hash, normalized payload, consent timestamp, expiry, and consumed user/ticket fields; raw token is never persisted.
- Protected `claimGuestGrievance` consumes a valid claim once for `ctx.user.id`, creates the existing grievance ticket, and preserves SLA/audit/alert behavior.

- [ ] Write failing tests for exact-one match, conflict, no match, missing consent, expired/replayed claim, and atomic single-use consumption.
- [ ] Run focused tests and verify expected failures.
- [ ] Implement identity normalization/matching using normalized email and phone; use generic public responses and do not log raw contact details.
- [ ] Implement claim schema/migration and the protected claim consumer with expiry and replay protection.
- [ ] Update `submitGrievance` to use shared validation, link exact matches, or create a pending claim only after consent.
- [ ] Run focused tests and verify they pass; run governance validation.
- [ ] Commit: `feat: secure grievance guest identity claims`

### Task 3: Authenticated grievance portal and authorization regressions

**Files:**
- Modify: `src/lib/trpc/routes/general/user-support.ts`
- Test: `src/lib/trpc/routes/general/user-support.test.ts` or existing support tests
- Create/modify: `src/app/(protected)/profile/grievances/page.tsx`
- Create/modify: `src/components/profile/general/grievances-page.tsx`
- Modify: `src/components/profile/profile-nav.tsx`
- Modify: `src/app/(protected)/profile/page.tsx` if a dashboard card is added

**Interfaces:**
- `listMyGrievances` returns only `category === "GRIEVANCE"` tickets for `ctx.user.id`.
- Existing `getTicket`, `getMessages`, and `sendMessage` remain owner-scoped; the portal links to the existing detail page or grievance detail route.

- [ ] Write failing tests for grievance-only listing and ticket-ID tampering on detail/messages/reply.
- [ ] Run focused tests and verify failure.
- [ ] Implement the dedicated page/menu item and reuse the existing ticket detail/reply UI.
- [ ] Implement/verify owner-scoped grievance query behavior and claim-token handoff from authenticated flow without exposing IDs in public responses.
- [ ] Run focused tests and verify pass.
- [ ] Commit: `feat: add customer grievance portal`

### Task 4: Public form UX, authenticated prefill, and regression verification

**Files:**
- Modify: `src/app/(home)/contact/page.tsx`
- Test: `src/app/(home)/contact/page.test.tsx` or validation/component tests
- Modify: existing admin grievance tests only if required for regression coverage

- [ ] Write failing tests for required phone field, field-level errors, prefill, explicit edit state, consent notice, and generic claim response.
- [ ] Run focused tests and verify failure.
- [ ] Add the phone field, local field errors, authenticated prefill, explicit edit affordance, consent notice, and claim/access continuation UI.
- [ ] Preserve existing category/order/description and success messaging.
- [ ] Run focused tests and verify pass.
- [ ] Commit: `feat: improve grievance submission experience`

### Task 5: Verification and governance reconciliation

- [ ] Run focused REN-245 tests.
- [ ] Run `bun test` and record unrelated baseline failures, if any.
- [ ] Run `bun run governance:validate -- docs/.work-items/REN-245/work-item.yaml`.
- [ ] Run `git diff --check`, build/type verification available within repository limits, and inspect the final diff.
- [ ] Run the required REN-245 implementation review and update `REVIEW.md`/`work-item.yaml` only through the review workflow.
- [ ] Commit final governance artifacts.
