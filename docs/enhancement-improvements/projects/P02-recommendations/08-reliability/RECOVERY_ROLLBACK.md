# Recovery & Rollback — P02

## General approach

All four V1 fixes (REN-147/150/157/160) are localized, independently revertible changes (per `07-feasibility/DEPENDENCIES.md` — no cross-item build dependency), consistent with this program's existing SPEC→REVIEW→TEST governance (referenced, not redefined here). Standard git revert of the specific commit/PR is sufficient recovery for any single item; none require a data migration or irreversible state change.

## Per-item rollback notes

- **REN-147:** the new independent fallback tier is purely additive (a new `else` branch/tier) — rollback is a simple revert with no data cleanup needed, since no new persistent data is written.
- **REN-150:** rollback reverts the `ORDER BY` clause change in `getProducts` — no data migration, purely a query-logic revert.
- **REN-157:** rollback reverts copy strings — trivially safe, no functional risk.
- **REN-160:** rollback removes the cache-wrapping calls — the underlying computation functions are unchanged, so removing the cache layer returns exactly to current (uncached) behavior with no data loss. If a bad cache entry were somehow served (e.g., a TTL/key bug), the safe immediate mitigation is a cache flush/bust (mechanism depends on chosen cache store — Redis `DEL`/`unstable_cache`'s revalidation tag, per whichever is chosen in implementation) rather than a full code rollback, and should be documented as a runbook step once FR-4 ships.

## Recovery from the REN-147 scenario itself (external host outage), independent of whether the fix has shipped

- **Before FR-1 ships:** no in-app recovery exists — recovery is entirely external (the ML host coming back up). This is the current, confirmed state, and is exactly the gap REN-147 exists to close.
- **After FR-1 ships:** the app self-recovers to a degraded-but-present state automatically (no manual intervention needed) via the new fallback tier; full recovery to ML-quality suggestions resumes automatically once the host returns, with no cache invalidation concern (FR-4's product-keyed cache would naturally repopulate with better results on next TTL expiry once the host is healthy again).

## Not applicable

No database schema changes, no infrastructure provisioning, and no irreversible external-system writes are part of any V1 item — this section is intentionally short because the actual risk profile of these fixes is low, per `07-feasibility/FEASIBILITY_ASSESSMENT.md`.
