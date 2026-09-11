# REVIEW: REN-217 — Database-Driven Dynamic Sitemap

## Executive Result

`REVIEW_FAILED`; `MATERIAL_DRIFT`; base `0cbf02a024d90db0461683906dc0a098a0c209b3`; head `029d7dc55c82e2cfb55443bc39a95d157ea82bf0`. Governance re-entry is required.

## Review Scope and Git Evidence

The review covers PR #658 and the current clean worktree. The PR contains 683 files and governance CI fails.

## Requirement Reconciliation

- REQ-001: PARTIAL — products, categories, blogs, brands, and fixed routes are queried, but completeness is not reconciled against actual live counts.
- REQ-002: PARTIAL — products/blogs/brands have filters; categories have no live state in the schema and no explicit visibility derivation.
- REQ-003: PASS — dynamic records use stored `updatedAt`; fixed routes use stable policy values.
- REQ-004: FAIL — there is no count check, bounded pagination, or `generateSitemaps()` threshold behavior.

## Scenario Reconciliation

SCN-001 and SCN-002 are partial. SCN-003 passes statically. SCN-004 fails because shard selection is absent and sitemap category URLs canonicalize to plain `/shop` through the shop layout.

## Invariant Reconciliation

INV-001 is partial. INV-002 fails: `/shop?categoryId=...` entries conflict with the route's canonical `/shop`, and no deduplication/sort policy is implemented.

## Flow and Architecture Review

FLOW-001 fails at the required shard-decision step. DEP-001/DEP-002 are otherwise reused.

## Security and Integration Review

SEC-001 is partial because category visibility is not derived. INT-001 is partial without generated XML/count verification.

## Scope and Drift Review

Material drift exists both within the sitemap contract (missing bounded count/sharding architecture) and across PR #658's 683-file scope.

## Test Expectation Review

TEXP-001 is partial; TEXP-002 fails; TEXP-003 fails. The test only searches source strings and does not execute sitemap generation with live/draft fixtures, count thresholds, XML output, or canonical checks.

## Findings

### REV-217-001

- Severity: HIGH
- Category: architecture
- Description: Required count-based bounded query and sitemap sharding are absent.
- Evidence: REQ-004/SCN-004/FLOW-001/TEXP-002; `src/app/sitemap.ts` calls four unrestricted `findMany` queries and exports no `generateSitemaps`.
- Impact: Large catalogs can produce slow generation or exceed sitemap URL limits.
- Recommendation: Implement deterministic count/pagination and threshold-based sharding with tests.

### REV-217-002

- Severity: HIGH
- Category: invariant
- Description: Category sitemap URLs conflict with the declared shop canonical.
- Evidence: INV-002/TEXP-003; sitemap emits `/shop?categoryId=...`, while shop layout always canonicalizes to `/shop`.
- Impact: The sitemap advertises URLs that tell crawlers another URL is canonical.
- Recommendation: Define canonical category destinations consistently before emitting them.

### REV-217-003

- Severity: BLOCKER
- Category: scope
- Description: PR #658 contains 683 files and fails governance CI.
- Evidence: PR diff and workflow run 34649025488.
- Impact: The sitemap cannot be safely reviewed or merged as an isolated change.
- Recommendation: Rebase/cherry-pick onto a clean current-main branch.

## Decisions Requiring Attention

None.

## Final Recommendation

Do not merge. Resolve REV-217-001 through REV-217-003 and rerun database-backed sitemap verification.
