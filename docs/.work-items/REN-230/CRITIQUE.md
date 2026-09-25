# REN-230 Independent Critique

Reviewer: independent read-only critic
Date: 2026-09-25
Result: BLOCKED pending owner decisions and contract tightening

## Findings

1. **Design blocker — collision approval:** the Linear ticket requires manual sign-off for all 16 public-vs-public collision groups. The implementation contract must not auto-resolve these groups solely by deterministic suffix order.
2. **Major — recovery:** UI-only progress is insufficient. A durable migration run, batch checkpoint, resumable apply, actor, counts, and tested sample rollback are required.
3. **Major — authorization:** page, preview, apply, and status endpoints must all enforce the administrator boundary independently.
4. **Design blocker — data consistency:** the history/run schema, locking, current-slug/history conflicts, and rollback conflict behavior need explicit rules.
5. **Major — idempotency:** preview manifests need a hash/scope/expiry and source-row version checks; proposed slugs must reserve existing and in-run candidates.
6. **Design blocker — compatibility:** define the exact legacy pattern, deployment order, permanent redirect status, query handling, canonical/sitemap gates, and sampled redirect checks.
7. **Major — observability/testing:** audit records need run/batch/actor/count/error fields and tests must cover redirect status, metadata, concurrency, collisions, resumability, rollback conflicts, and manual collision groups.
8. **Design blocker — owner decisions:** collision processing order and historical analytics behavior are still ticket-owner decisions, not automatic decisions.

## Verdict

Not safe to mark `READY_FOR_DEV` until the owner confirms the two open decisions and the contract includes the required durable run, conflict, redirect, and validation rules.
