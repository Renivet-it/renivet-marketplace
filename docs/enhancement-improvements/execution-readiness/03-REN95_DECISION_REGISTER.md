# Gate C — REN-95 Decision Register

## Finding: the actual 6 decisions are genuinely unrecoverable — documented, not invented

Exhaustive search performed 2026-08-30:

1. `CODEX_SPEC_IMPLEMENTATION_REPORT.md` (read in full) — confirms the pilot outcome (BLOCKED, six Class-C decisions labeled `DEC-001`–`DEC-006`, seven dependencies, four Critic design-blockers) but states explicitly (§6): "The REN-95 pilot artifacts were created and validated locally under `docs/.work-items/REN-95/`, but are deliberately excluded from this reusable-adapter PR because work items are branch-local and temporary." §14/§19 give only topic labels, never the actual decision questions or recommendations.
2. `docs/.work-items/REN-95/` — does not exist on the current checkout, `origin/master`, or any other branch/tag checked via `git ls-tree`/`git cat-file -e`. The pilot ran in an isolated worktree (`.worktrees/renivet-spec-governance`, branch `codex/renivet-spec-governance`) that was never merged and no longer exists.
3. Linear REN-95 — full issue description fetched: contains only the original three-layer guest-checkout bug report, no governance decisions. Zero comments on the issue.
4. Repo-wide grep for "REN-95" — every hit is either the implementation report itself or later documents citing REN-95 only as the checkout-login-wall bug for context.
5. `scripts/governance/fixtures/` — contains only generic reusable fixtures, none REN-95-specific.

**The six decisions existed only as ephemeral pilot output in a worktree/branch intentionally never committed anywhere durable.**

## Decision register (topic labels only — the actual question/recommendation text does not exist)

| Decision | Why required | Who must decide | Blocking impact | Related issue | Evidence |
|---|---|---|---|---|---|
| DEC-001 — Guest principal / identity model | Checkout currently requires an authenticated `userId`; removing the login wall requires deciding what identifies a guest order | Product + Engineering | Blocks REN-95 implementation start | REN-95 | Topic label only, `CODEX_SPEC_IMPLEMENTATION_REPORT.md` §14/§19 |
| DEC-002 — Proof/PII policy for guest orders | What identity verification (if any) is required for a guest order, and what PII is collected/required | Product + Security | Blocks REN-95 | REN-95 | Same |
| DEC-003 — Payment cardinality/atomicity/refund policy for guests | How refunds/payment reconciliation work without an authenticated account to attach them to | Finance + Engineering | Blocks REN-95 | REN-95 | Same |
| DEC-004 — COD policy for guests | Whether Cash-on-Delivery remains available to unauthenticated guests, and under what fraud/verification controls | Product + Finance | Blocks REN-95 | REN-95 | Same |
| DEC-005 — Account-linking policy | Whether/how a guest order can later be linked to an account if the guest signs up | Product | Blocks REN-95 | REN-95 | Same |
| DEC-006 — Coupon policy for guests | Whether guest checkouts are eligible for the same coupon/promotion logic as authenticated checkouts | Product + Marketing | Blocks REN-95 | REN-95 | Same |

## Required action before REN-95 can proceed

The pilot must be **re-run**, and this time its `docs/.work-items/REN-95/` artifacts must actually be committed (not left in a discarded worktree) so the real decision text is durable and reviewable. Until that happens, **any future claim of "the 6 decisions say X" should be treated as fabrication** unless traced to a freshly re-run, committed artifact.
