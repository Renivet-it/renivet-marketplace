# REN-254 C1 Security Guard Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the ten approved Stage 3A security guard gaps while preserving existing permission policy, business history, and the REN-172 ownership boundary.

**Architecture:** Reuse existing Clerk auth, `getUserPermissions`, `isTRPCAuth`, finance module access, query helpers, and Redis cache conventions. Put authorization before sensitive reads and external effects; use atomic conditional updates for invite/status transitions; anonymize the existing user row rather than deleting it.

**Tech Stack:** Next.js server actions, tRPC, TypeScript, Drizzle/Postgres, Clerk, Redis, Bun/Vitest.

**Spec:** `docs/superpowers/specs/2026-10-01-ren-254-c1-security-guard-hardening-design.md` and `docs/.work-items/REN-254/SPEC.md`

## Global Constraints

- No schema, migration, permission-model redesign, new audit table, unrelated cleanup, or duplicate REN-172 implementation.
- Authorization must precede target-brand reads, database writes, and external side effects.
- Email bulk actions preserve `MANAGE_CATEGORIES`; WhatsApp bulk actions preserve `MANAGE_CATEGORIES` or `MANAGE_BRANDS`.
- User deletion keeps the existing user id and preserves sale, tax, payout, order, ownership, and membership history.
- Use Bun for tests and run `bun test` after TypeScript changes.
- Run `bun run governance:validate -- docs/.work-items/REN-254/work-item.yaml` after governance edits.

## Review Focus

- Caller-supplied tenant identifiers: wrong-brand reads/writes are denied before related data loads or provider calls; test in Tasks 1, 2, and 5.
- Replayed/concurrent invite and webhook events: use atomic/idempotent behavior; test in Tasks 4 and 7.
- Status races and repeated return/refund actions: conditional transitions prevent duplicate side effects; test in Task 5.
- Server-action bypass of page permissions: unauthenticated and unauthorized direct calls fail for send, read, retry, and clear operations; test in Task 6.
- Existing foreign-key references after deletion: anonymization preserves rows and relations; test in Task 7.

### Task 1: Role and confidential-brand authorization

**Files:**
- Modify: `src/lib/trpc/routes/brands/roles.ts`, `src/lib/trpc/routes/brands/members.ts` only for non-REN-172 role/target-brand checks; link REN-172 for the 51-procedure set rather than duplicating it.
- Modify: `src/lib/trpc/routes/brands/confidential.ts`, `src/lib/trpc/routes/brands/brands.ts`.
- Test: existing brand route/security test location discovered from repository conventions; add focused negative and same-brand/site-admin cases.

**Interfaces:**
- Consumes: existing `isTRPCAuth`, `getUserPermissions`, `hasPermission`, brand cache/query helpers.
- Produces: brand-role writes cannot set site bits; confidential writes require target-brand ownership/site-admin policy; `getBrandWithConfidential` returns only for owner or site `VIEW_BRANDS`.

- [ ] Write failing tests for role site-permission stripping/rejection, wrong-brand confidential read/write denial, same-brand authorization, and site `VIEW_BRANDS` read access.
- [ ] Implement role normalization at the authoritative write boundary so brand-scoped role writes persist `sitePermissions = "0"`; leave REN-172’s 51-procedure comparison utility out of this task and record its evidence link.
- [ ] Add confidential authorization before loading target confidential data or calling Shiprocket/Delhivery; for updates, reset `pending` only when `bankName`, bank-account fields, `pan`, or `gstin` change, including both update procedures.
- [ ] Guard `getBrandWithConfidential` with owner or site `VIEW_BRANDS` before the query and add no broader PII exposure.
- [ ] Run focused tests, then `bun test`.

### Task 2: Order and cart safety

**Files:**
- Modify: `src/lib/trpc/routes/general/orders.ts`.
- Test: focused order/cart route tests.

**Interfaces:**
- Consumes: authenticated `ctx.user.id` and existing order/cart query APIs.
- Produces: order deletion is unavailable/denied; cart item deletion ignores caller-supplied user ids.

- [ ] Write failing tests proving `deleteOrder` rejects and a mismatched input user id cannot delete another user’s cart item.
- [ ] Replace the unsafe order deletion path with an explicit denied response or remove the exposed procedure according to the existing router contract; use `ctx.user.id` for cart deletion.
- [ ] Run focused tests and `bun test`.

### Task 3: REN-172 evidence reconciliation

**Files:**
- Modify: `docs/.work-items/REN-254/CRITIQUE.md`, `docs/.work-items/REN-254/work-item.yaml` only when evidence links/status change.
- Reference: `docs/.work-items/REN-172/SPEC.md`, `docs/.work-items/REN-172/work-item.yaml`.

**Interfaces:**
- Consumes: REN-172’s approved 51-procedure contract and eventual implementation/PR evidence.
- Produces: a traceable cross-reference with no duplicate implementation.

- [ ] Verify the REN-172 issue/branch/PR evidence covers all 51 procedures and the shared target-brand comparison behavior.
- [ ] Record the evidence link and change `DEP-254-001` from `pending_evidence` only after the evidence exists; otherwise leave item 5 explicitly open.
- [ ] Run governance validation; do not modify `src/` for this task.

### Task 4: Authenticated, bounded brand invite acceptance

**Files:**
- Modify: `src/actions/brand-invite-accept.ts`, `src/lib/db/queries/brand-invite.ts`.
- Test: invite action/query tests.

**Interfaces:**
- Consumes: Clerk `auth()`, `brandInvites`, `brandMembers`, and existing cache helpers.
- Produces: `acceptBrandInvite({ brandId, code })` derives member id from session, checks invite brand/expiry/uses, and consumes invite safely.

- [ ] Write failing tests for unauthenticated callers, caller-supplied identity mismatch, wrong brand, invalid code, expired invite, exhausted invite, existing membership, successful acceptance, and repeated/concurrent acceptance.
- [ ] Remove the trusted `memberId` input; use `auth()` and reject absent identity before reads. Load the invite by code, verify brand and expiry/use limit, and use a conditional usage update or transaction so a use cannot exceed `maxUses`.
- [ ] Create membership only after validation and make repeated same-member acceptance idempotent without incrementing usage twice.
- [ ] Run focused tests and `bun test`.

### Task 5: Return/replace authorization and state transitions

**Files:**
- Modify: `src/lib/trpc/routes/general/returnReplace.ts`.
- Test: return/replace route tests and finance access tests where existing conventions require.

**Interfaces:**
- Consumes: `requireRefundModuleAccess(ctx, "manage")`, authenticated user id, `orderReturnRequests` statuses `pending|approved|rejected|processing|completed`.
- Produces: customer create ownership guard; manage permission and conditional status checks before every admin/refund/shipment effect.

- [ ] Write failing tests for create wrong-owner denial, approve/reject/complete/shipment unauthorized denial, invalid status transitions, and repeated action no-op/rejection.
- [ ] Guard `create` by loading the order/request ownership relation and comparing it to `ctx.user.id` before insert or notification.
- [ ] Add manage access before admin mutations; use conditional updates for `pending -> approved/rejected`, `approved -> processing/completed` as applicable to the existing flow, and reject all terminal/replayed states before refund, Razorpay, Delhivery, database mutation, or notifications.
- [ ] Preserve the existing customer-facing flow and existing audit/attribution behavior; do not create a new status or alter the broader return policy.
- [ ] Run focused tests and `bun test`.

### Task 6: Bulk messaging server-action guards

**Files:**
- Modify: `src/actions/sendBulkEmail.ts`, `src/actions/whatsapp/send-marketing-notification.ts`.
- Test: server-action tests for email and WhatsApp send/read/retry/clear operations.

**Interfaces:**
- Consumes: Clerk `auth()`, cached user roles, `getUserPermissions`, `hasPermission`, `BitFieldSitePermission`.
- Produces: direct action calls enforce the dashboard’s existing permission policy.

- [ ] Write failing tests for unauthenticated and unauthorized direct calls to send, log reads, retries, and clear operations; add authorized regression cases.
- [ ] Add a shared local guard per action module that resolves the authenticated user and role-derived site permissions before any database or provider call. Use `MANAGE_CATEGORIES` for email and `MANAGE_CATEGORIES | MANAGE_BRANDS` as an OR policy for WhatsApp.
- [ ] Apply the guard to every exported action, including logs and retry/clear helpers, without trusting client UI state.
- [ ] Run focused tests and `bun test`.

### Task 7: Clerk deletion anonymization and history preservation

**Files:**
- Modify: `src/app/api/webhooks/clerk/route.ts`.
- Test: webhook deletion tests covering cascades/history and repeated events.

**Interfaces:**
- Consumes: verified Clerk `user.deleted` webhook and existing `users` schema constraints.
- Produces: idempotent in-place anonymization with no `db.delete(users)`.

- [ ] Write failing tests asserting user row and related order/brand/member references remain, identity fields become deterministic (`Deleted User`, `deleted+<id>@invalid.renivet`, nullable phone/avatar cleared), and repeated webhook delivery is safe.
- [ ] Replace hard delete with an update keyed by user id; use deterministic values satisfying non-null/unique constraints and avoid changing ownership/membership foreign keys.
- [ ] Preserve PostHog/cache behavior and ensure later `user.updated` processing cannot restore a deleted identity without an explicitly approved lifecycle rule; add a guard if current webhook ordering permits that regression.
- [ ] Run focused tests and `bun test`.

### Task 8: Release evidence and final governance reconciliation

**Files:**
- Modify: `docs/.work-items/REN-254/work-item.yaml`, `docs/.work-items/REN-254/CRITIQUE.md`, and add the task-local release evidence artifact only on the feature branch.

**Interfaces:**
- Consumes: test output, staging evidence, Neon snapshot, rollback target, Redis `user:*` flush record, and REN-172 evidence.
- Produces: complete evidence package for Ayan’s technical record and Akshay’s release decision.

- [ ] Record negative auth tests, staging validation, pre-deploy Neon snapshot, rollback target, post-deploy Redis `user:*` flush, and one-week 401/403/support monitoring note.
- [ ] Run `bun run governance:validate -- docs/.work-items/REN-254/work-item.yaml` and retain any unresolved dependency as non-closure.
- [ ] Invoke `$renivet-review REN-254` after implementation; keep review read-only and do not mark closure without the approved diff/evidence reconciliation.
