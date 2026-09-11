# REVIEW: REN-215 — Festive SEO + Performance Readiness

## Executive Result

`REVIEW_FAILED`; `MATERIAL_DRIFT`; base `0cbf02a024d90db0461683906dc0a098a0c209b3`; head `029d7dc55c82e2cfb55443bc39a95d157ea82bf0`. Governance re-entry is required.

## Review Scope and Git Evidence

PR #658 targets `main` and contains 683 changed files (36,904 additions, 2,301 deletions), far beyond REN-215 scope. The current worktree is clean. The prior review recorded stale head `b5170721`; this rerun uses the current pushed head.

## Requirement Reconciliation

- REQ-001: PASS — festive metadata and one page H1 are present in `src/app/(home)/festive/page.tsx` and `StorefrontCatalogPage`.
- REQ-002: FAIL — ItemList/Product schema reads `product.media[].url`, but the catalog query projects `product.media[].mediaItem.url`.
- REQ-003: PARTIAL — one mobile hero has `priority` and festive OG art is configured; the required visual breakpoint evidence is absent.
- REQ-004: PARTIAL — canonical and `force-dynamic` remain, but the PR-wide diff prevents a clean no-regression conclusion.

## Scenario Reconciliation

SCN-001 passes statically. SCN-002 fails because the Product image projection is incompatible with the returned data shape. SCN-003 is partial without visual evidence. SCN-004 is partial because the PR contains unrelated application changes.

## Invariant Reconciliation

INV-001 fails for the schema projection mismatch. INV-002 is partial because the oversized PR prevents attribution of rendering and analytics preservation.

## Flow and Architecture Review

FLOW-001 and DEP-001 are partial: product data reaches the schema builder, but media is mapped through the wrong property. DEP-002 passes for the festive OG asset.

## Security and Integration Review

SEC-001 passes for the fields visibly emitted. INT-001 is partial because no rendered Rich Results evidence exists.

## Scope and Drift Review

Material drift: PR #658 includes hundreds of files unrelated to the approved festive SEO boundary and currently fails governance CI on an unrelated REN-102 branch identity.

## Test Expectation Review

TEXP-001 and TEXP-002 are partial: `tests/seo-phase-1.test.ts` checks source strings, not rendered HTML, visual priority behavior, or Rich Results validity. TEXP-003 is partial due the PR scope.

## Findings

### REV-215-001

- Severity: HIGH
- Category: requirement
- Description: Festive Product JSON-LD uses the wrong media shape.
- Evidence: REQ-002/SCN-002/INV-001; `storefront-catalog-page.tsx` reads `media.url`, while `product.ts` maps media to `mediaItem`.
- Impact: Product images can be omitted, preventing valid Product rich-result eligibility.
- Recommendation: Map the authoritative `mediaItem.url` field and add rendered schema coverage.

### REV-215-002

- Severity: BLOCKER
- Category: scope
- Description: PR #658 contains 683 changed files outside REN-215 scope and governance CI fails.
- Evidence: PR base/head diff and workflow run 34649025488.
- Impact: The SEO change cannot be safely reviewed or merged independently.
- Recommendation: Rebase/cherry-pick the SEO commits onto current `main` in a clean branch.

## Decisions Requiring Attention

None.

## Final Recommendation

Do not merge. Correct REV-215-001 and isolate the SEO changes per REV-215-002, then rerun review and rendered validation.
