# REN-175 Independent Critic Review

Reviewer: independent fresh-context read-only critic

Category coverage: requirements/scenarios; failure/recovery; security/privacy; state/data consistency; integrations/retries/idempotency; compatibility/migration; observability/operability/testability; assumptions/dependencies/decisions.

## Findings

- **DESIGN_BLOCKER DB-001 (DEC-002/REQ-002) — resolved by owner confirmation:** The warehouse-mode equivalent pre-dispatch document is undefined. REN-175 must fail closed until REN-183 supplies the inbound receipt/GRN policy and predicate; it must not invent one.
- **MAJOR MJ-001 (REQ-004, INV-002):** `saveShipment` and the Delhivery flow persist shipment state before the guarded order transition. Define validate-before-persist or a transaction with rollback and test the exact shipment/order state after rejection.
- **MAJOR MJ-002 (REQ-005, INV-004):** Order update, history, tax-invoice creation, notifications, audits, and events are not atomic. Define local transaction scope and best-effort external side-effect behavior.
- **MAJOR MJ-003 (REQ-001, INV-001):** `corporateOrderQueries.updateCorporateOrder` remains unrestricted. Add a guard-only status writer or an enforceable static/repository audit for direct guarded-state writes.
- **MAJOR MJ-004 (REQ-001, INV-002/004):** Concurrent callers can read stale document chains and unconditionally overwrite status, duplicate history/events, or trigger duplicate tax invoices. Define serialization/conditional update and exact idempotent retry behavior.
- **MINOR mn-001 (REQ-003/SEC-001):** Pin `isTRPCAuth(BitFieldSitePermission.MANAGE_ORDERS)` and test it independently from brand membership.
- **MINOR mn-002 (TEXP-001..005):** Assert rejected side-effect absence, shipment rollback/persistence semantics, duplicate prevention, and failure telemetry.

## Dependency conclusion

REN-176 QC remains a deferred integration at the shared guard boundary. REN-183 remains a follow-up dependency for enabling warehouse-mode dispatch; owner confirmation resolves the REN-175 policy by requiring fail-closed behavior until then.
