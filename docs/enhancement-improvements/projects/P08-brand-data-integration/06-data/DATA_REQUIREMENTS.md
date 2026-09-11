# Data Requirements — P08

## Canonical data model (from research, `04-data-model/`)

Renivet's existing schema is extended, not replaced. `04-data-model/` corrected Wave 0's initial framing: provenance isn't totally absent (`products.inventorySource`/`inventoryLastSyncedAt` already exist), and media isn't raw-URL-only (`brandMediaItems` is a real asset table) — the gaps are narrower than first assumed:

- **Gap 1 (identity)**: `products.sku`/`products.nativeSku` are both nullable with no unique constraint; `productVariants.nativeSku` is `.notNull().unique()` — an asymmetric identity strength, unresolved which is canonical for external mapping. V1 resolution: `sku` (brand-scoped) is the canonical anchor (F5); add a partial unique constraint `(brand_id, sku) WHERE sku IS NOT NULL`.
- **Gap 2 (provenance)**: the existing pattern needs generalizing beyond inventory/product-level to variant/price/media scope. This is the "minimal provenance extension."
- **Gap 5 (history)**: no historical/point-in-time inventory log exists anywhere; every quantity write is destructive/overwriting. Recommendation: do NOT build a full historical log in V1 beyond what the per-batch import log provides — a dedicated append-only inventory history table is Phase 2 territory tied to the reconciliation spine.
- **Media**: reuse `brandMediaItems` for File-First writes; do not perpetuate `productVariants.image`'s raw-URL bypass.
- **Multi-warehouse**: explicitly NOT built — zero evidence of demand (only schema trace is a single optional brand-address field). Leave a nullable `warehouseId` column as future-proofing only, do not build a location dimension around it.

## RDBMS feasibility: the smallest safe V1 design

The task requires comparing four shapes explicitly and picking the smallest safe V1 design, addressing transaction boundaries, idempotency, concurrency, duplicate import, partial failure, rollback, replay, audit trail, retention, storage, indexing, stale imports, and cancellation.

### Option A — Staging table

A generic landing table (raw rows + a status column) that the write path later drains into canonical tables.

- **Transaction boundaries**: two disjoint transactions (load-to-staging, then drain-to-canonical) — the seam between them is exactly where partial-failure and idempotency bugs live.
- **Idempotency**: requires a separate dedup key and re-run logic on the staging table itself; nothing prevents re-loading the same file into staging twice without extra bookkeeping.
- **Concurrency**: multiple concurrent uploads share one generic table — needs a batch-ID column to partition safely, which is most of the way to Option B's design anyway.
- **Partial failure / rollback**: naturally partial (each staged row can independently succeed/fail at drain time), but there's no natural place to record *why* a row failed without adding columns that make the "staging" table start to look like an import-record table.
- **Audit trail / retention**: not designed for retention — staging tables are typically truncated or short-lived, which conflicts with FR-15's requirement for a durable per-batch log.
- **Verdict**: DEFER. Staging solves the load/drain seam but converges toward Option B once you add the columns V1 actually requires (batch ID, per-row status, per-row error, provenance). Building it as a separate primitive alongside those additions is redundant.

### Option B — Import-batch + import-record

One `import_batches` row per upload (brand, file, uploader, timestamp, overall status), with one `import_records` row per source row (raw data, mapped data, per-row status: pending/matched/held/validated/failed/written, per-row error detail, resulting canonical row ID once written).

- **Transaction boundaries**: batch creation is its own transaction; each record's validate-then-write is naturally scoped per-record (or in small chunks) inside the batch, not one giant all-or-nothing transaction — this is what makes partial failure (FR-16) a first-class outcome instead of an edge case.
- **Idempotency**: a batch has a natural identity (file hash + brand + timestamp, or an explicit "supersede previous pending batch" rule); replaying a batch id is a no-op if all records already reached a terminal state, and re-running only picks up records still in a non-terminal (held/failed) state.
- **Concurrency**: two concurrent uploads from the same brand are two distinct batches — no shared mutable state beyond the canonical tables they eventually write to, which already have brand-scoped constraints.
- **Duplicate import**: detectable at the batch level (same file hash uploaded twice) and at the record level (same SKU appearing twice within one batch — AC-25).
- **Partial failure / rollback**: exactly what FR-16/AC-19 need — succeeded records commit, failed records are individually visible, no all-or-nothing transaction wrapping the whole file.
- **Replay/retry**: retry re-processes only records not yet in a terminal success state (AC-30) — the per-record status column is what makes this safe.
- **Audit trail**: the batch + records *are* the audit trail — no separate table needed for V1's minimal-provenance requirement (FR-15).
- **Retention/storage/indexing**: bounded and predictable — one row per uploaded source row, indexed by `(batch_id)`, `(brand_id, sku)`, and `(status)` for queue queries; retention policy (e.g., keep N months, or keep indefinitely since volume is bounded by upload frequency × catalog size) is a simple operational choice, not a design risk.
- **Stale imports / cancellation**: a batch stuck in `awaiting_approval` past a TTL is trivially queryable (`status = 'awaiting_approval' AND created_at < now() - interval`) and cancellable by transitioning the batch to `cancelled` without touching canonical tables, since nothing writes until approval.
- **Verdict: RECOMMENDED for V1.** This is the smallest design that satisfies every V1 functional requirement (FR-9 through FR-16) without inventing machinery V1 doesn't need.

### Option C — Change-set / event model

Every proposed change is an immutable event (`field X on entity Y proposed to change from A to B, from source S, at time T`); canonical state is a projection/materialization of applied events.

- **Transaction boundaries**: naturally very fine-grained (one event = one transaction), which is more flexibility than V1's requirements call for.
- **Idempotency**: strong by construction (events are immutable and identity-keyed) — this is the model's real strength.
- **Concurrency / audit trail / replay**: excellent — this is essentially what the deferred reconciliation spine wants (drift detection needs exactly this kind of historical, replayable event log; see `06-sync-and-reconciliation/RECONCILIATION.md`'s "stale-since" computation, which requires comparing state across time).
- **Cost**: requires an event store, a projection/materialization mechanism, and query patterns most engineers building on Renivet's current stack (Drizzle/Postgres, no existing event-sourcing infrastructure) aren't already set up for. This is a materially larger build than Option B for a V1 that only needs "did this row succeed, and can a human see why not."
- **Verdict**: DEFER to Phase 2/V3, specifically as the natural foundation for the reconciliation spine once its trigger fires (a brand with two concurrent live sources). Building it now would be paying full event-sourcing complexity against a V1 problem that Option B solves completely.

### Option D — Hybrid (staging + batch/record + selective event log)

Use Option B for the transactional write path, and layer a lightweight append-only event log only for the specific fields that need point-in-time history (e.g., inventory quantity, for future reconciliation).

- This is directionally where Phase 2 likely goes (Option B's `import_records` becomes the source of truth for "what happened in this batch," and a separate append-only log picks up specifically for reconciliation's need to compare state across time) — but building the event-log half now, before a second live source exists to reconcile against, is exactly the kind of speculative infrastructure `14-critic/ANTI_OVERENGINEERING.md` flags against.
- **Verdict**: not V1. Revisit when the reconciliation spine's trigger fires (see `10-roadmap/VERSION_TRIGGERS.md`) — at that point, Option B's tables likely don't need to be replaced, just supplemented with an event log for the specific fields reconciliation needs.

## V1 recommendation, confirmed

**Import-batch + import-record (Option B)** is the smallest safe V1 design. This confirms, rather than corrects, the research's own steer toward a "minimal provenance extension" (`14-critic/ANTI_OVERENGINEERING.md`'s Component 1 decision) — the concrete schema shape that best satisfies that steer is the batch/record pair, not a bare staging table (too little structure for V1's partial-failure/audit needs) and not a change-set/event model (too much structure for a system with no reconciliation consumer yet).

## Data volume and retention

No hard volume target is measured in the research (UNKNOWN — see `01-research/EVIDENCE_INDEX.md` on brand-tier distribution). Assuming the illustrative Priya/Rahul/Ananya persona range (40 to 3,000+ SKUs per brand, ~50 brands), `import_records` at even frequent re-upload cadence stays in the low-millions-of-rows range over a year — well within a single Postgres table's comfortable operating range with the indexes named above. No partitioning or archival strategy is required for V1; revisit if real volume proves this wrong.
