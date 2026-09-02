# REN-181 independent Critic review

Reviewer: `ren181_critic`  
Mode: fresh-context, read-only  
All required categories reviewed.

## Findings

- **DESIGN_BLOCKER DB-001:** Finance/CA commission GST classification remains unresolved (REQ-005/DEC-001/INT-003); approval must remain blocked.
- **MAJOR DATA-001:** Source authority, precedence, snapshot version/status, and reconciliation rules are unspecified; current service derives values from mutable order data and caller commission percent (`corporate-documents.ts:638-676`).
- **MAJOR FALLBACK-001:** Settlement PDF route independently fabricates gross/GST/commission/tax/SET values when no statement exists (`settlement-statement.pdf/route.tsx:109-159`); commission PDF has 10%/18% fallbacks (`commission-invoice.pdf/route.tsx:118-133`).
- **MAJOR TX-001:** Immutability/versioning lacks transaction boundaries, current-pointer/unique constraints, and retry algorithm; current service deletes then inserts (`corporate-documents.ts:700-731`).
- **MAJOR MIG-001:** Migration/backfill, duplicate legacy rows, cascade-delete retention, and null audit metadata are unspecified (`corporate-platform.ts:1283-1334`).
- **MAJOR POLICY-001:** TCS/194-O policy schema, approval metadata, calculation base, and caller-input prohibition are unspecified; current code hard-codes both deductions (`corporate-documents.ts:675-686`).
- **MAJOR AUTH-001:** Issuance service lacks explicit actor/tenant authorization and settlement downloads expose financial PII under broad route checks (`settlement-statement.pdf/route.tsx:36-70,176-190`).
- **MAJOR OBS-001:** Audit sink, required fields, retention, correlation/idempotency key, and event assertions are unspecified despite existing `corporateEvents` infrastructure.
- **MAJOR TEST-001:** Tests lack concrete fixtures and failure-injection/concurrency/migration/route-absence/PII assertions.
- **MAJOR COMP-001:** SET is not in the current numbering union (`corporate-documents.ts:79`); exact format, uniqueness, and sequence-gap policy need to be frozen.

## Recommendation

Keep approval `BLOCKED`. Freeze the Finance/CA classification and concrete snapshot, transaction, policy, migration, authorization, observability, and test contracts before implementation.
