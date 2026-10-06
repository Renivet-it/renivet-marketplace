# REN-254 C1 Security Guard Hardening Design

## Purpose

Close the ten approved Stage 3A security guard gaps without redesigning the permission system, adding schema changes, or inventing business policy.

## Confirmed decisions

- The 51 cross-brand authorization procedures belong to REN-172. REN-254 verifies and links REN-172 evidence; it does not duplicate that implementation.
- User deletion must anonymize or soft-delete identity data while preserving order, sales, tax, payout, and other required business history. The final legal retention period remains a Legal/CA decision outside this task.
- The deletion implementation is an in-place anonymization of the existing `users` row: keep the Clerk/user id for foreign keys, set a deterministic deleted-user name, replace the unique email with an id-derived `deleted+<userId>@invalid.renivet` value, clear nullable contact/avatar data, and make repeated webhook delivery a no-op. Brand ownership/membership relationships are not transferred or removed by this task.
- Ayan collects technical evidence. Akshay reviews it and owns the release decision.
- Existing role and tenant boundaries remain authoritative; unauthorized actor/tenant combinations are denied.

## The ten checklist items

1. Brand-role writes cannot grant site permissions; site bits are computed only from site roles.
2. Confidential bank/PAN/GSTIN updates require ownership and reset verification to pending.
3. Confidential brand reads require caller-brand ownership or site `VIEW_BRANDS`.
4. Disable order deletion; cart item deletion uses the authenticated user identity.
5. Track REN-172's 51-procedure cross-brand authorization fix and evidence.
6. Brand invite acceptance derives identity from `auth()` and validates code, brand, and expiry server-side.
7. Return/replace mutations require ownership, refund-module manage access, and valid status transitions.
8. Bulk messaging actions require session and permission guards.
9. Release evidence includes Neon snapshot, negative authorization tests, rollback target, and Redis `user:*` cache flush.
10. Clerk `user.deleted` anonymizes/soft-deletes the user without deleting business-history rows.

## Scope boundaries

In scope are exactly these ten items and their focused negative/regression tests. Out of scope are REN-172 implementation, read-side H-07/H-08 fast-follow work, a permission-model redesign, new audit tables, schema changes, unrelated cleanup, and new business policy.

## Design

Use existing `isTRPCAuth`, site/brand permission bitfields, finance/module access patterns, Clerk webhook handling, and query conventions. Authorization checks must happen before target-brand reads, writes, or external calls. Where REN-172 owns a procedure, REN-254 records the linked evidence instead of changing it. For user deletion, preserve the row needed by foreign keys and replace identity fields with the deterministic deleted-user representation above; verify database relations so sale, tax, and payout history cannot cascade-delete.

For bulk messaging, preserve the permissions already exposed by the dashboard: email requires the existing `MANAGE_CATEGORIES` site permission; WhatsApp requires the existing `MANAGE_CATEGORIES` or `MANAGE_BRANDS` site permission. The server actions must enforce the same rule independently of page visibility, including read/retry/clear-log actions.

For brand invites, validate the authenticated user from `auth()`, load the invite by code, require the supplied brand id to match the invite, reject expired or exhausted invites, and increment usage only after successful membership creation. The invite query must enforce the usage condition atomically or the implementation must document and test the chosen concurrency-safe approach.

For return/replace actions, `create` checks the authenticated caller owns the customer request before reading sensitive related data. `approveRequest`, `createRTOShipment`, and `markCompleted` require refund-module manage access and an explicit current-status precondition before any state change, refund, shipment, or notification side effect. Existing request statuses and transitions must be confirmed from the schema/query code during implementation; no new business status is introduced.

The implementation must keep cache behavior explicit: after deployment, flush `user:*` and record the evidence because role changes otherwise remain cached for up to 24 hours.

## Required verification

- One negative authorization test for each C1 item, with same-brand/authorized regression coverage where applicable.
- Invite tests for unauthenticated identity mismatch, wrong brand, invalid code, expired code, and successful same-brand acceptance.
- Destructive-operation tests proving order deletion is unavailable/denied and user deletion preserves business history.
- Return/replace tests for ownership, manage permission, status preconditions, and unauthorized callers.
- Bulk-message tests for unauthenticated and unauthorized callers.
- REN-172 evidence link and coverage verification for its 51 procedures.
- Staging evidence, rollback target, snapshot evidence, Redis cache flush record, and one-week 401/403/support monitoring note.

## Approval state

Decision blockers are recorded in Linear REN-254. This design requires independent L3 Critic review and human approval before implementation planning or application-code changes.
