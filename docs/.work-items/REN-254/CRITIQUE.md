# REN-254 Critique

## Review state

Independent read-only L3 critique pass completed against the Linear issue, approved design, REN-172 contract, repository evidence, and the Stage 1 / execution-scope references. No application code, schema, migration, test, or production artifact was changed.

## Findings

- DESIGN_BLOCKER: Item 5 overlapped REN-172. Resolved: REN-172 implements the 51 procedures; REN-254 verifies evidence only.
- DESIGN_BLOCKER: User deletion behavior and retention boundary were unclear. Resolved: anonymize/soft-delete now; Legal/CA decides final retention period separately.
- DESIGN_BLOCKER: Release ownership was unspecified. Resolved: Ayan records evidence; Akshay owns release approval.
- MAJOR: Authorization checks must precede target-brand reads and external calls. Evidence: `getBrandWithConfidential` is currently a protected-only read; confidential creation calls Shiprocket/Delhivery after only a generic brand permission; `createRTOShipment` reads confidential data and can call Razorpay/Delhivery before any refund/manage check.
- MAJOR: `updateConfidentialDetails` currently documents that verification status is not affected, while the checklist requires bank/PAN/GSTIN changes to reset verification to `pending`. The plan must identify those fields explicitly and preserve status for unrelated edits.
- MAJOR: Brand invite acceptance trusts caller-supplied `memberId` and `brandId`, has no `auth()` check, does not validate the invite code/brand/expiry/use limit, and increments uses non-atomically. The implementation needs authenticated identity and concurrency-safe invite consumption.
- MAJOR: Bulk email and WhatsApp server actions, including log reads/retries/clear operations, currently have no server-side session/permission guard. Page visibility is not an authorization boundary. The plan must preserve the existing dashboard permission policy while enforcing it in each action.
- MAJOR: User deletion currently hard-deletes `users`; `orders.userId`, brand ownership, memberships, and other relations use cascade behavior. The design now specifies in-place deterministic anonymization, retained foreign-key identity, idempotent webhook handling, and no relationship transfer/removal.
- MAJOR: Return/replace `approveRequest`, `rejectRequest`, `markCompleted`, and `createRTOShipment` are protected-only and mutate state or trigger notifications/refunds/shipment calls without the required refund manage/status checks. The plan must specify allowed current states and check before side effects.
- MAJOR: Redis `user:*` cache flush is part of release evidence because role changes can remain cached for up to 24 hours.
- DEPENDENCY: REN-172 remains Todo, so item 5 is ownership-resolved but implementation evidence is still pending. REN-254 may implement the other checklist items, but cannot claim final item-5 closure until REN-172 evidence is linked.

## Scope guard

No permission-system redesign, new schema, new audit table, unrelated cleanup, production-data mutation, or duplicate REN-172 implementation. The critique is not a READY_FOR_DEV approval; the exact return/replace status transitions and invite concurrency strategy must be captured in the plan/tests before implementation.
