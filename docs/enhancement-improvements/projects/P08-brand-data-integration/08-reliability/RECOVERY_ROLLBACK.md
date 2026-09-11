# Recovery & Rollback — P08

## Batch-level recovery (V1)

The import-batch + import-record design (`06-data/DATA_REQUIREMENTS.md` Option B) makes recovery a first-class per-row operation, not an all-or-nothing rollback:

- A batch stuck in `awaiting_approval` past a reasonable TTL is queryable and can be transitioned to `cancelled` without touching canonical tables, since nothing writes until approval (addresses "stale imports / cancellation" from the parent task's requirement list).
- A partially-failed batch (`status = 'partially_failed'`) retains per-record status; retrying re-processes only records not yet in a terminal success state — already-written rows are not re-written or duplicated (FR-16, AC-30).
- There is no cross-batch rollback mechanism in V1 (e.g., "undo everything from batch X after the fact") — this is explicitly not built, since it would require the historical/point-in-time state log that `06-data/DATA_REQUIREMENTS.md` defers to Phase 2 (Option C/D, change-set/event model). If a brand needs to correct a bad import, the correction path in V1 is a new, corrected upload (with its own dry-run/approval gate), not an automated rollback of the prior one.

## What "rollback" means for a rejected dry-run (the common case)

Because writes only happen after explicit approval of the dry-run diff (FR-13), the overwhelmingly common "rollback" scenario — a brand catches a mistake before it goes live — requires no rollback mechanism at all: rejecting the diff means nothing was ever written (AC-16).

## Existing Unicommerce sync recovery (unchanged in V1)

Per-brand transactional writes already provide atomicity per brand (a bad sync for one brand doesn't corrupt that brand's data mid-write) — this existing correct behavior is preserved, not modified, beyond the F10 access-control fix. No general retry/backoff or replay mechanism exists beyond OAuth 401/403 retry-then-refresh; expanding this is not V1 scope (see `08-reliability/PERFORMANCE.md`).

## Recovery scope explicitly deferred to Phase 2

Full reconciliation (detect-and-report drift against a full data set on an independent cadence, "stale-since" computation across multiple runs) requires the historical inventory log and event-style audit trail this package defers (`06-data/DATA_REQUIREMENTS.md` Option C/D) until a second live source per brand creates an evidenced need for it (see `10-roadmap/VERSION_TRIGGERS.md`). V1's minimal per-batch log is not a substitute for reconciliation — it is the audit trail reconciliation would eventually consume, built early because it is cheap, not because reconciliation itself is being built now.
