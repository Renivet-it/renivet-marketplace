# REN-103 — Finance router type-safety increment

## Scope

This increment addresses the finance-router slice of REN-103 in `src/lib/trpc/routes/general/finance.ts` and a bounded product-quantity helper slice in `src/lib/db/queries/product.ts`. It removes explicit `any`, `as any`, and `any[]` usage from the targeted finance router and quantity helper while preserving all existing behavior.

## Requirements

- REQ-001: The finance router contains no explicit type annotations/casts of `any`, including `: any`, `as any`, or `any[]`; existing `z.any()` schema calls are intentionally out of scope because they preserve arbitrary JSON input acceptance.
- REQ-002: Request context and finance inputs use repository-owned inferred or named types.
- REQ-003: Refund `costAllocation` remains the existing four-value Zod enum, and COD categorization remains the existing `pending | matched | discrepancy | overdue | critical | ghost` value set, with no runtime narrowing or widening.
- REQ-004: Dynamic JSON inputs (`z.any()` fields such as bank snapshots, GST totals/validation summaries, and platform-setting values) retain their current arbitrary-value acceptance; audit before/after values are converted only through a typed JSON-compatible boundary that preserves dates, nulls, nested objects, arrays, and scalar content.
- REQ-005: Authorization, procedure inputs/outputs, service calls, and finance behavior remain unchanged.
- REQ-006: `sanitizeProductQuantities` uses a named input shape for product and variant quantities without changing normalization behavior; normalization remains `Number(value)`, non-finite values to `0`, `Math.trunc`, then `Math.max(0, ...)`, while product null/undefined and missing/non-array variants retain their current values.
- REQ-007: Product parse helpers use `unknown`/named input types and preserve successful schema parsing plus the existing sanitized fallback and logging behavior for malformed rows.
- REQ-008: Public product visibility helpers use a named product/section-row shape and preserve the exact active, available, published, undeleted, approved, and active-brand predicate.

## Design

Use the existing `Context` type from the tRPC context module for `assertFinanceAccess`, with an explicit assertion/narrowing step so callers may safely use `ctx.user.id` only after the existing unauthorized check. Reuse Zod-inferred input types and existing finance/schema types for enum values. Keep existing `z.any()` schemas unchanged and type their inferred values as unknown/arbitrary data at local boundaries. Replace audit casts with a JSON-compatible adapter matching `writeFinanceAuditEvent`, preserving the existing row fields and values. Preserve all procedure definitions and service arguments.

## Scenarios and invariants

- SCN-001: Authenticated users with valid finance permissions continue to reach the same view/manage procedures.
- SCN-002: Invalid or unauthorized requests retain existing UNAUTHORIZED/FORBIDDEN behavior.
- SCN-003: Refund, COD, payout, tax, deletion, and audit procedures retain their input and service-call behavior.
- SCN-004: The source guard rejects reintroduction of explicit unsafe-any syntax in the finance router.
- SCN-005: Product quantity normalization preserves null/undefined product quantities and non-negative integer variant quantities without explicit unsafe-any syntax in the helper.
- SCN-006: Product array and single-row parsing preserve schema-success output and sanitized fallback output on validation failure.
- SCN-007: Public product and section-row visibility helpers preserve the existing inclusion predicate.
- INV-001: No finance calculation, authorization decision, database mutation, or audit payload semantics change.
- INV-002: The router remains compatible with the existing AppRouter procedure contract.
- INV-003: Product quantity normalization returns the same product shape and normalized quantity values.
- INV-004: Product parsing retains existing logging and fallback behavior without filtering malformed rows or throwing new errors.
- INV-005: Public visibility does not broaden or narrow the existing product predicate.

## Flow, dependencies, and security

FLOW-001: tRPC procedure context/input → typed access guard and service arguments → existing finance service/database/audit boundary.
FLOW-002: Product query/database rows → typed quantity normalization helper → existing parsing consumers.

Dependencies are the existing `Context`, finance schema enums, finance services, and `writeFinanceAuditEvent`. SEC-001 requires existing authentication, module-level permission checks, tenant/user identity, and audit behavior to remain unchanged. No schema, migration, external integration, or production configuration change is in scope.

## Test expectations

- TEXP-001 (`regression`, REQUIRED): source guard confirms no explicit annotation/cast unsafe-any syntax in `finance.ts` while allowing the documented existing `z.any()` schemas.
- TEXP-002 (`unit`, REQUIRED): focused assertions cover typed context narrowing, the exact refund/COD enum values, arbitrary JSON input compatibility, audit payload field/value preservation, and unchanged procedure markers.
- TEXP-003 (`regression`, REQUIRED): existing finance tests and complete Bun test suite pass.
- TEXP-004 (`regression`, REQUIRED): product quantity helper source guard and focused markers cover `Number`, `Number.isFinite`, `Math.trunc`, `Math.max(0, ...)`, null/undefined preservation, and non-array variant preservation.
- TEXP-005 (`regression`, REQUIRED): product parse-helper source guard covers schema safeParse success and sanitized fallback/logging branches.
- TEXP-006 (`regression`, REQUIRED): visibility helper source guard covers every existing predicate and section-row delegation.

## Failure and compatibility contract

Authorization failures remain `UNAUTHORIZED`/`FORBIDDEN` before finance work. Existing mutation ordering remains unchanged: a successful finance mutation followed by an audit failure continues to surface the audit failure exactly as before; no new retry or idempotency behavior is introduced. No schema or migration is required, and existing callers and serialized AppRouter output must remain source-compatible.

## Out of scope

Other REN-103 increments such as product visibility/media/revenue, `order-ops.ts`, order queries, and remaining repository files are intentionally deferred to later commits in this PR or follow-up work.

## Approval

This is an L2 compile-time refactor because it crosses tRPC, authorization, finance services, database values, and audit boundaries, but it must preserve runtime behavior.
