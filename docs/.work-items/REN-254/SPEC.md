# REN-254 C1 Security Guard Hardening

Status: `IN_REVIEW`

This is the governance contract for the bounded ten-item security checklist. It does not authorize production changes.

## Requirements

- REQ-254-001: Prevent brand-role writes from granting site-level permissions.
- REQ-254-002: Enforce ownership and verification-state reset for confidential financial identity changes.
- REQ-254-003: Protect confidential brand reads with ownership or site-view authorization.
- REQ-254-004: Deny unsafe order deletion and scope cart deletion to the authenticated user.
- REQ-254-005: Verify REN-172's 51-procedure cross-brand authorization evidence without duplicating its implementation.
- REQ-254-006: Derive invite identity from the authenticated session and validate brand/code/expiry.
- REQ-254-007: Enforce ownership, manage permission, and status preconditions on return/replace mutations.
- REQ-254-008: Protect bulk-messaging actions with session and permission checks.
- REQ-254-009: Record release safety evidence, including snapshot, rollback target, and cache flush.
- REQ-254-010: Preserve business history when a Clerk user is deleted by anonymizing/soft-deleting identity data.

## Scenarios

- SCN-254-001: Brand role cannot gain site permissions through a brand-scoped write.
- SCN-254-002: Wrong-brand confidential write/read is denied before data or external side effects.
- SCN-254-003: Order deletion is denied and cart deletion uses the session user.
- SCN-254-004: REN-172 evidence covers the 51 cross-brand procedures and is linked here.
- SCN-254-005: Invite acceptance rejects identity, brand, code, and expiry mismatches.
- SCN-254-006: Return/replace mutations reject wrong owner, missing manage access, and invalid status.
- SCN-254-007: Bulk messaging rejects unauthenticated/unauthorized callers.
- SCN-254-008: User deletion preserves business history while anonymizing identity.
- SCN-254-009: Release evidence is complete and no production data is mutated during tests.

## Invariants

- INV-254-001: Brand-scoped operations cannot cross tenant boundaries.
- INV-254-002: Unauthorized requests are rejected before sensitive reads or external calls.
- INV-254-003: Sale, tax, and payout history is not removed by user deletion.
- INV-254-004: Existing site-admin and same-brand authorized behavior remains available.
- INV-254-005: REN-254 does not duplicate REN-172 implementation.

## Dependencies and decisions

- DEP-254-001: REN-172 implementation and evidence for item 5; resolved ownership boundary.
- DEP-254-002: Legal/CA retention-period decision; not required to implement immediate anonymization/soft-delete.
- DEP-254-003: Release evidence and decision; Ayan records, Akshay approves.
- DEC-254-001: REN-172 owns item 5; resolved.
- DEC-254-002: User identity is anonymized/soft-deleted while business history remains; resolved.
- DEC-254-003: Release evidence and approval ownership; resolved.

## Test expectations

- TEXP-254-001: Security negative tests for role escalation and confidential access.
- TEXP-254-002: Destructive-operation and deletion-history preservation tests.
- TEXP-254-003: Invite and return/replace authorization/state tests.
- TEXP-254-004: Bulk-messaging session/permission tests.
- TEXP-254-005: REN-172 coverage/evidence reconciliation.
- TEXP-254-006: Release-evidence and cache-flush verification without production mutation.

## Approval gate

Independent L3 Critic review and written design approval are pending. The task must not move to `READY_FOR_DEV` before those gates pass.
