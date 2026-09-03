# Gate 22 — Database / Staging Architecture Re-Validation

Re-verified 2026-08-30 directly against current schema (`src/lib/db/schema/product.ts`, `brand.ts`), not re-derived from the SRS package's reasoning alone.

## Confirmed still accurate

- `products.inventorySource`/`inventoryLastSyncedAt` exist at `product.ts:131-132`, indexed at line 212 — the existing provenance pattern P08's minimal-extension recommendation generalizes.
- Grep across `src/lib/db/schema/*` for `import_batch`/`import_record` (and camelCase variants) returns **zero matches** — an import-batch/import-record design would be genuinely new, not duplicating anything that already exists.

## Option comparison (re-confirmed)

| Option | Transaction boundary | Idempotency | Concurrency | Duplicate upload | Partial failure | Rollback/replay | Audit trail | Verdict |
|---|---|---|---|---|---|---|---|---|
| A. Staging table | Weak — a shared staging area invites cross-batch dedup ambiguity | Poor without a batch identifier | Needs explicit locking | Hard to detect without a batch key | No per-row status | Manual | Weak | Not recommended |
| **B. Import-batch + import-record** | Natural — one transaction per batch, per-row status inside it | Strong — batch ID + row ID gives natural idempotency | Batches are naturally isolated from each other | Detected via a batch-level hash/identifier | Per-row status gives partial-failure visibility for free | Straightforward — re-run failed rows within a batch | Strong — this is the audit trail by construction | **Recommended — smallest safe V1** |
| C. Change-set/event model | Strong in principle | Strong | Strong | Strong | Strong | Strong | Strongest | Correctly rejected as premature — full event-sourcing infra cost with no evidenced need beyond what B already provides at V1 scale |
| D. Hybrid | Same benefits as C, same cost | — | — | — | — | — | — | Same rejection as C |

## Confirmation

**Import-batch + import-record remains the correct, smallest-safe V1 design.** It gives per-row status, partial-failure visibility, and an audit trail "for free" by construction, without staging's dedup ambiguity or event-sourcing's infrastructure cost. No correction to this recommendation is needed — this gate independently re-verifies it, it does not merely repeat it.

## Remaining open items (unchanged from the original research/SRS)

Retention policy, stale-batch handling, and approval-expiry rules are not yet specified in detail — these are implementation-level SPEC decisions, not architecture-level blockers, and should be resolved when P08's `/SPEC` is actually written (contingent on Gate F's authorization).
