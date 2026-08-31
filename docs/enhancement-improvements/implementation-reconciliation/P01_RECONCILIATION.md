# P01 — Search & Ranking Intelligence — Implementation Reconciliation

## Finding: no implementation exists to reconcile

`git diff --stat` between the SRS baseline (`b2b35fb7`) and current `origin/master` (`4943c40a`), scoped to `src/lib/python/`, `src/lib/trpc/routes/general/product.ts`, and every other path the P01 SRS package (`docs/enhancement-improvements/projects/P01-search-ranking/`) names as relevant, returns **empty**. No work-item exists for any P01 Linear issue (REN-146, 148, 149, 151, 154, 155, 156, 158, 159, 167) on `origin/master`. No branch or open PR touches this scope (see `CURRENT_STATE.md`).

## Reconciliation matrix

| Item | Linear | SRS requirement | Current code | Status | Gap | Risk |
|---|---|---|---|---|---|---|
| REN-146 (ML-service timeout/config) | REN-146 | Add timeouts to all live call sites; fix hardcoded-IP config, per P01 SRS FR-1 | Unchanged since SRS baseline | **MISSING** | Full implementation | None new — this is the pre-existing, already-documented risk (no timeout on a hung upstream) |
| REN-148 (search-index sync cadence) | REN-148 | Staged, cheap-step-only investigation | Unchanged | **MISSING** | Full implementation | None new |
| REN-149 (intent-redirect reconnect) | REN-149 | One-line fix at `product-search.tsx` L386-390 | Unchanged | **MISSING** | Full implementation | None new |
| REN-151 (parallelize sequential calls) | REN-151 | Parallelize `getEmbedding()`/brand-distance/RAG fetch | Unchanged | **MISSING** | Full implementation | None new |
| REN-154 (search logging) | REN-154 | Replace `// TODO` stub with real capture | Unchanged | **MISSING** | Full implementation | None new |
| REN-155 (requireMedia post-pagination) | REN-155 | Fix filter-after-count ordering | Unchanged | **MISSING** | Full implementation | None new |
| REN-156 (dead code removal) | REN-156 | Remove `ai-suggestion.ts` | Unchanged | **MISSING** | Full implementation | None new |
| REN-158 (redundant ILIKE OR-branch) | REN-158 | Stop building OR-branch when RAG succeeds | Unchanged | **MISSING** | Full implementation | None new |
| REN-159 (catalog listing cache) | REN-159 | Cache category/category+sort views | Unchanged | **MISSING** | Full implementation | None new |
| REN-167 (typo tolerance) | REN-167 | Correctly DEFERRED per SRS — no action expected | N/A | **MATCH** (by inaction) | None | None — deferral itself is the correct state |
| Two independent search subsystems | — | P01 SRS documents RAG/ILIKE retrieval vs. deterministic intent classifier as separate, UI-coupled-only systems | Unchanged | **MATCH** (architecture as documented, no drift) | None | None |
| No unnecessary AI/ML/MCP introduced | — | P01 SRS: no new AI/ML/MCP needed | Confirmed — no new dependency, model, or MCP config added anywhere in the diff window | **MATCH** | None | None |

## Section 5 checks, answered directly

- **REN-146 actual live-call-site scope:** unchanged from the SRS package's own correction (4 live sites, not 6+, since `ai-suggestion.ts` is dead code) — no code has moved to alter this.
- **External ML host configuration:** unchanged — still hardcoded, per the existing finding.
- **Timeout/bounded execution:** not implemented.
- **Search logging:** not implemented — still a stub.

## Final decision

**VERIFY nothing** — there is nothing implemented to KEEP, CHANGE, REVERT, or BLOCK. **DEFER** the entire matrix pending an actual implementation branch. No test-coverage gap analysis is meaningful here since no code changed; existing test coverage (or its absence) for these files is unchanged from what the SRS package's `09-validation/TEST_STRATEGY.md` already documented.
