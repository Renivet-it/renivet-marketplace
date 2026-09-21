# REN-235 Independent Critique

Reviewer: independent fresh-context critic  
Mode: read-only  
Result: blocked pending design decisions and implementation-boundary confirmation

## Findings

### CRIT-235-001 — DESIGN_BLOCKER — stale previews are not protected

The catalog can change after preview. Apply must use target version or compare-and-set checks and report stale rows instead of overwriting a later price change.

### CRIT-235-002 — MAJOR — zero, unchanged, null, and 100% discounts are undefined

The contract must define whether zero/no-op rows are skipped, whether null prices are blocked, and whether 100% discounts are allowed before mutation.

### CRIT-235-003 — MAJOR — input normalization is underspecified

Define trimming, case sensitivity, Unicode handling, leading zeros, encoding, XLSX formula/value handling, accepted column aliases, file size, and sheet selection.

### CRIT-235-004 — DESIGN_BLOCKER — durable batch recovery is unspecified

The import needs durable job and batch states, ownership/lease behavior, retry limits, cancellation semantics, and restart recovery. In-memory progress cannot safely support production imports.

### CRIT-235-005 — MAJOR — rollback outcomes are incomplete

Define atomic versus partial rollback, per-row success/conflict/failure states, retry behavior, and audit records for rollback attempts and failures.

### CRIT-235-006 — DESIGN_BLOCKER — authorization is not concrete

Specify permission keys, role matrix, and server-side enforcement for preview, apply, history, error downloads, and rollback. UI hiding alone is insufficient.

### CRIT-235-007 — MAJOR — audit and error-report controls are incomplete

Define tenant scope, retention, access checks, sensitive-data limits, and CSV-injection-safe error exports for import files, previews, audit rows, and downloads.

### CRIT-235-008 — DESIGN_BLOCKER — idempotency must include target versions

Source hash and row identity alone are unsafe when catalog prices change. Replays must be target/version aware and distinguish already-applied rows from stale rows.

### CRIT-235-009 — MAJOR — product/variant uniqueness needs an explicit algorithm

Define precedence across product SKU/native-SKU and variant SKU/native-SKU, collision handling, and the exact blocked result when more than one target matches.

### CRIT-235-010 — MAJOR — repeated-import compare-at behavior is undefined

Specify how an existing discounted product is handled, whether a higher existing compare-at value is preserved, and how repeated campaigns avoid erasing the original reference price.

### CRIT-235-011 — MAJOR — parser contract is incomplete

Define supported MIME types, worksheets, headers, locale/decimal rules, formulas, malformed rows, maximum size/count, and whether the source is stored or discarded after normalization.

### CRIT-235-012 — MAJOR — catalog cache invalidation is not addressed

After apply and rollback, product and storefront caches/search indexes must be invalidated or revalidated so the previewed prices become observable consistently.

### CRIT-235-013 — DESIGN_BLOCKER — persistence/migration plan is unresolved

Durable imports, batches, row outcomes, audit history, and rollback require an explicit schema/migration plan or a documented existing persistence mechanism.

### CRIT-235-014 — MAJOR — exact route and navigation protection are unspecified

Define the admin route, menu registration, feature visibility, and unauthorized response behavior under Platform Settings.

### CRIT-235-015 — MAJOR — observability is insufficient

Add structured import/job/batch IDs, counters, retry and duration metrics, conflict counts, and redacted failure logs suitable for support investigation.

### CRIT-235-016 — MAJOR — required test coverage is incomplete

Add tests for stale previews, concurrent edits, duplicate targets, authorization, parser edge cases, retry/restart recovery, rollback conflicts, migrations, and cache invalidation.

### CRIT-235-017 — DESIGN_BLOCKER — confirmation metadata is internally contradictory

The resolved pricing decision still declares human confirmation required. Record the governing confirmation or change the field so the approval gate reflects the actual decision.

### CRIT-235-018 — MAJOR — dependencies remain unresolved

DEP-235-002 and DEP-235-003 need concrete owners, permission decisions, persistence decisions, and acceptance evidence before implementation is approved.

## Review conclusion

This critique is complete, but the specification remains blocked and must not be marked READY_FOR_DEV until the design blockers and major safety decisions are resolved.
