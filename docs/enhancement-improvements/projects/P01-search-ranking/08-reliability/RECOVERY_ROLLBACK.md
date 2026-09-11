# Recovery & Rollback — P01

Every issue in this Epic is a small, isolated, independently-revertible code change (CONFIRMED by scope review in `07-feasibility/DEPENDENCIES.md`) — none touches schema migrations, none is a multi-step data transformation, and all are within a single application deploy's blast radius. Standard rollback (revert the commit/PR, redeploy) is sufficient for all nine active issues; no special recovery procedure is needed beyond what the existing SPEC→REVIEW→TEST governance already provides (see `09-validation/TEST_STRATEGY.md`).

| Issue | Rollback complexity | Notes |
|---|---|---|
| REN-146 | LOW | Revert timeout/config change; behavior reverts to today's (unbounded) calls |
| REN-149 | LOW | Revert `onSuccess` branch; UI behavior reverts to always-generic-navigation |
| REN-151 | LOW | Revert to sequential awaits; functionally identical, only slower |
| REN-154 | LOW-MEDIUM | If schema changes are needed for result-count logging (depends on the `06-data/DATA_REQUIREMENTS.md` decision), a migration rollback plan applies — standard additive-column rollback, no destructive migration anticipated |
| REN-155 | LOW | Revert predicate/count change; count-mismatch bug returns but nothing breaks |
| REN-156 | LOW | Revert the file deletion (git revert restores it); since it was dead code, restoring it has zero behavioral effect either way |
| REN-158 | LOW | Revert to always-OR'd ILIKE predicate; correctness unaffected, only efficiency reverts |
| REN-159 | LOW | Disable/bypass the cache layer; falls back to always-fresh DB queries (the current behavior) |
| REN-148 | LOW (staged scope) | A confirmation/scheduling step has no rollback risk beyond process reversal |

## No feature-flag requirement identified

Given the low individual risk and small blast radius of each change, this Epic does not require feature-flagging every fix — standard code review + the existing test/regression suite (`product-ordering.test.ts` precedent) is proportionate. **Exception**: if REN-154 requires a schema migration, follow standard additive-migration practice (nullable new column, backfill-free) to keep rollback trivial — this is a process note, not a new requirement invented for this Epic.
