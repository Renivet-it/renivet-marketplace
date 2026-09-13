# REVIEW: REN-217 — [SEO][P0] Build Database-Driven Dynamic Sitemap

## Executive Result

`REVIEW_PASSED_WITH_FINDINGS`. The implementation is within the approved SEO Phase One Recovery sitemap design: canonical fixed routes plus public products, published blogs, and active brands are generated deterministically in bounded 50,000-URL shards. No material drift is identified. The comparison base is `main` at `0cbf02a024d90db0461683906dc0a098a0c209b3`; HEAD is `4507015b054d6f7882af27555dba1c02924f324e`. The sitemap implementation and tests were uncommitted during this review, and are included as working-tree evidence. Governance re-entry is not required.

## Review Scope and Git Evidence

- Linear identity: requested `REN-217`, retrieved `REN-217`, and `docs/.work-items/REN-217/work-item.yaml` `task.id` are identical. Linear is Backlog; the local approved contract is `READY_FOR_DEV` with `approval.state: APPROVED`.
- Base/head: `origin/main` merge base `0cbf02a024d90db0461683906dc0a098a0c209b3`; current HEAD `4507015b054d6f7882af27555dba1c02924f324e`; PR URL `null`.
- Reviewed implementation evidence: working-tree changes to `src/app/sitemap.ts`, `src/lib/seo/sitemap.ts`, and `src/lib/seo/sitemap.test.ts`.
- The existing `src/app/sitemap.ts` four-entry, build-timestamp array is replaced by the Next 15 supported `generateSitemaps()` plus `sitemap({ id })` route form. The installed metadata route loader invokes this form and renders `MetadataRoute.Sitemap` output.

## Requirement Reconciliation

- `REQ-001` — PASS. `src/lib/seo/sitemap.ts#buildSitemapEntries` emits the fixed home, shop, festive, and swap-passport routes and maps public products, published blogs, and active brands to the existing `/products/[slug]`, `/blogs/[slug]`, and `/brands/[id]` routes. The approved recovery design explicitly excludes category query URLs because their canonical is `/shop` and clean category routes do not exist.
- `REQ-002` — PASS. `src/app/sitemap.ts#publicProductPredicate` requires active, available, published, non-deleted, approved products from active brands; blog and brand queries require their published/active state. The pure builder repeats these predicates defensively before publishing an entry.
- `REQ-003` — PASS. Dynamic entries use each row's stored `updatedAt`; fixed entries omit fabricated `lastModified` values. The route reads on every request via `dynamic = "force-dynamic"`.
- `REQ-004` — PASS. `getSitemapPageCount`, `getSitemapQueryWindows`, and `generateSitemaps` keep each shard at or below 50,000 entries, query the selected slice only, and never add category parameter variants.

## Scenario Reconciliation

- `SCN-001` — PASS. Fixed and eligible product, blog, and brand URLs are covered by `buildSitemapEntries` tests.
- `SCN-002` — PASS. The tests exercise draft, deleted, unapproved, and inactive-brand products, unpublished blogs, and inactive brands.
- `SCN-003` — PASS. The entry-builder test asserts the supplied `updatedAt` is used as `lastModified`.
- `SCN-004` — PASS. Tests cover 0, 49,999, 50,000, and 50,001-entry page boundaries plus limit/offset windows. Category query entries are rejected.

## Invariant Reconciliation

- `INV-001` — PASS. Both the database predicates and the pure entry guard prevent non-public rows from entering an output entry.
- `INV-002` — PASS. HTTPS-origin validation, URL encoding, deterministic URL/key sorting, and first-winner deduplication produce canonical, stable URLs.

## Flow and Architecture Review

- `FLOW-001` — PASS. The route counts the three dynamic content classes first, calculates a selected shard window, fetches only non-zero windows with stable `orderBy` clauses, and passes the rows through the pure entry builder.
- `DEP-001` — PASS. It uses the repository's existing Drizzle `db.$count`, `select`, `where`, `orderBy`, `limit`, and `offset` conventions without writes.
- `DEP-002` — PASS. The product, blog, and brand URL shapes match the public route files. Categories are intentionally not a URL source under the later approved canonical policy.
- `INT-001` — PASS. Query exceptions are not caught or replaced with partial output; `loadSitemapShard` propagates count/fetch failures visibly to the sitemap route.

## Security and Integration Review

- `SEC-001` — PASS. Read-only database access uses explicit public-state predicates, including deleted and approval guards, so private, draft, deleted, or inactive content is not emitted.
- No new credentials, writes, migrations, external calls, or production configuration are introduced.

## Scope and Drift Review

`NO_DRIFT`. Changes are limited to the approved sitemap route and its pure helper/tests. The Linear issue's earlier category/collection wording is superseded for this recovery implementation by `docs/superpowers/specs/2026-09-12-seo-phase-one-recovery-design.md` and `plans/2026-09-12-seo-phase-one-recovery.md`, which explicitly prohibit `/shop?categoryId=...` sitemap entries pending clean category routes.

## Test Expectation Review

- `TEXP-001` — PARTIAL. `src/lib/seo/sitemap.test.ts` statically covers fixed URLs, live-state exclusions, timestamps, deduplication, and deterministic order, but it uses a fake `SitemapDataSource` rather than a live Drizzle/database integration.
- `TEXP-002` — PASS. Tests assert all requested page-size boundaries and that only the selected bounded product/blog/brand query windows are requested.
- `TEXP-003` — PASS. The canonical query-URL exclusion test prevents the known noncanonical category regression.

## Findings

### REV-001

- Severity: LOW
- Category: test
- Description: The required integration coverage is represented by a deterministic data-source fake, not a live database-backed sitemap route test.
- Evidence: `TEXP-001`; `src/lib/seo/sitemap.test.ts#loadSitemapShard`; no database fixture or integration harness is changed in the reviewed diff.
- Impact: The focused suite proves route-independent filtering and bounded failure propagation but cannot prove the deployed database connection has matching rows.
- Recommendation: Add an isolated database integration or deployment smoke check that compares public-record counts with sitemap output before SEO Phase One release review.

## Decisions Requiring Attention

None.

## Final Recommendation

Accept this implementation for the approved recovery scope with no governance re-entry. Track `REV-001` as a non-blocking release-verification follow-up; it does not change the tested canonical, filtering, bounded-query, or failure-propagation behavior.
