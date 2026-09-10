# REN-103 — Finance router type-safety increment

## Scope

This increment addresses the finance-router slice of REN-103 in `src/lib/trpc/routes/general/finance.ts`. It removes explicit `any`, `as any`, and `any[]` usage from this file while preserving the existing tRPC procedures, authorization checks, finance service calls, database writes, audit events, and serialized API behavior.

## Requirements

- REQ-001: The finance router contains no explicit type annotations/casts of `any`, including `: any`, `as any`, or `any[]`; existing `z.any()` schema calls are intentionally out of scope because they preserve arbitrary JSON input acceptance.
- REQ-002: Request context and finance inputs use repository-owned inferred or named types.
- REQ-003: Refund `costAllocation` remains the existing four-value Zod enum, and COD categorization remains the existing `pending | matched | discrepancy | overdue | critical | ghost` value set, with no runtime narrowing or widening.
- REQ-004: Dynamic JSON inputs (`z.any()` fields such as bank snapshots, GST totals/validation summaries, and platform-setting values) retain their current arbitrary-value acceptance; audit before/after values are converted only through a typed JSON-compatible boundary that preserves dates, nulls, nested objects, arrays, and scalar content.
- REQ-005: Authorization, procedure inputs/outputs, service calls, and finance behavior remain unchanged.

## Design

Use the existing `Context` type from the tRPC context module for `assertFinanceAccess`, with an explicit assertion/narrowing step so callers may safely use `ctx.user.id` only after the existing unauthorized check. Reuse Zod-inferred input types and existing finance/schema types for enum values. Keep existing `z.any()` schemas unchanged and type their inferred values as unknown/arbitrary data at local boundaries. Replace audit casts with a JSON-compatible adapter matching `writeFinanceAuditEvent`, preserving the existing row fields and values. Preserve all procedure definitions and service arguments.

## Scenarios and invariants

- SCN-001: Authenticated users with valid finance permissions continue to reach the same view/manage procedures.
- SCN-002: Invalid or unauthorized requests retain existing UNAUTHORIZED/FORBIDDEN behavior.
- SCN-003: Refund, COD, payout, tax, deletion, and audit procedures retain their input and service-call behavior.
- SCN-004: The source guard rejects reintroduction of explicit unsafe-any syntax in the finance router.
- INV-001: No finance calculation, authorization decision, database mutation, or audit payload semantics change.
- INV-002: The router remains compatible with the existing AppRouter procedure contract.

## Flow, dependencies, and security

FLOW-001: tRPC procedure context/input → typed access guard and service arguments → existing finance service/database/audit boundary.

Dependencies are the existing `Context`, finance schema enums, finance services, and `writeFinanceAuditEvent`. SEC-001 requires existing authentication, module-level permission checks, tenant/user identity, and audit behavior to remain unchanged. No schema, migration, external integration, or production configuration change is in scope.

## Test expectations

- TEXP-001 (`regression`, REQUIRED): source guard confirms no explicit annotation/cast unsafe-any syntax in `finance.ts` while allowing the documented existing `z.any()` schemas.
- TEXP-002 (`unit`, REQUIRED): focused assertions cover typed context narrowing, the exact refund/COD enum values, arbitrary JSON input compatibility, audit payload field/value preservation, and unchanged procedure markers.
- TEXP-003 (`regression`, REQUIRED): existing finance tests and complete Bun test suite pass.

## Failure and compatibility contract

Authorization failures remain `UNAUTHORIZED`/`FORBIDDEN` before finance work. Existing mutation ordering remains unchanged: a successful finance mutation followed by an audit failure continues to surface the audit failure exactly as before; no new retry or idempotency behavior is introduced. No schema or migration is required, and existing callers and serialized AppRouter output must remain source-compatible.

## Out of scope

Other REN-103 increments such as `product.ts`, `order-ops.ts`, order queries, and remaining repository files are intentionally deferred to separate PRs.

## Approval

This is an L2 compile-time refactor because it crosses tRPC, authorization, finance services, database values, and audit boundaries, but it must preserve runtime behavior.
