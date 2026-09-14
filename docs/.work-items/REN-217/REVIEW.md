# REVIEW: REN-217 — [SEO][P0] Build Database-Driven Dynamic Sitemap

## Executive Result

`REVIEW_PASSED_WITH_FINDINGS`; `NO_DRIFT`; base branch `main` at `342b7091274b06fcd7ec1da14f87807be90e7d66`; head `aa85e96ed995d4cc02c0a75ea479d377762c8251`; PR URL `null`; governance re-entry is not required. The sitemap implementation and the approved canonical-safe collection decision together satisfy the approved contract. One non-blocking static-test coverage finding remains.

## Review Scope and Git Evidence

- Identity matched before this write: requested ID `REN-217`, retrieved Linear ID `REN-217`, work-item directory `docs/.work-items/REN-217`, and `task.id` are identical. Linear is Backlog, has no comments, and lists `REN-218` and `REN-221` as related work.
- Contract gate passed before review output: `task.status: READY_FOR_DEV`, `approval.state: APPROVED`, an empty `design_blockers` list, and a non-empty approver. `SPEC.md` and `CRITIQUE.md` were read.
- Reviewed only `342b7091274b06fcd7ec1da14f87807be90e7d66..aa85e96ed995d4cc02c0a75ea479d377762c8251`. The range changes `src/app/sitemap.xml/route.ts`, `src/app/sitemap/[id].xml/route.ts`, `src/lib/seo/sitemap-data.ts`, `src/lib/seo/sitemap.ts`, `src/lib/seo/sitemap.test.ts`, and the approved `SPEC.md` decision. `git diff --check` reported no whitespace errors.
- The worktree contains unrelated, pre-existing task-local governance edits. No sitemap application file has uncommitted changes. Sibling Phase One changes are intentionally combined and are not REN-217 drift.
- This was a static review: no application tests, database queries, or implementation edits were performed.

## Requirement Reconciliation

- `REQ-001` — PASS. `buildSitemapEntries` maps canonical fixed home, shop, festive, and swap-passport URLs plus eligible products, published blogs, and active brands. The approved canonical-safe decision explicitly excludes category/collection filter variants until an authoritative public, live canonical collection entity exists.
- `REQ-002` — PASS. `sitemapDataSource` filters products to active, available, published, non-deleted, approved records with active brands; blogs require `isPublished`; brands require `isActive`. The builder repeats the public-state checks.
- `REQ-003` — PASS. Dynamic entries use stored `updatedAt`; fixed entries do not fabricate timestamps. Both route handlers use `dynamic = "force-dynamic"`, so content is re-read without manual regeneration.
- `REQ-004` — PASS. `getSitemapPageCount` and `getSitemapQueryWindows` enforce the 50,000-entry threshold and bounded selected windows. The approved decision requires `/shop` once and prohibits counting or emitting `/shop?categoryId=...` filter variants.

## Scenario Reconciliation

- `SCN-001` — PASS. The builder covers every approved current sitemap source, including the approved `/shop` canonical representation in place of noncanonical collection/category variants.
- `SCN-002` — PASS. Static tests cover draft, deleted, unapproved, inactive-brand, unpublished-blog, and inactive-brand exclusions.
- `SCN-003` — PASS. Tests assert that stored dynamic `updatedAt` values become sitemap `lastModified` values; route handlers are dynamic.
- `SCN-004` — PASS. Tests cover 0, 49,999, 50,000, and 50,001 entries, bounded windows, deterministic ordering, deduplication, and category-query exclusion while retaining `/shop`.

## Invariant Reconciliation

- `INV-001` — PASS. Database predicates and builder guards prevent non-live product, blog, and brand records from becoming public sitemap entries. The approved collection decision avoids emitting sources without a live/public predicate.
- `INV-002` — PASS. HTTPS-origin validation, encoded dynamic identities, deterministic sorting, deduplication, and canonical-static filtering produce stable canonical URLs.

## Flow and Architecture Review

- `FLOW-001` — PASS. The sitemap index counts eligible records, advertises shard URLs, and each shard calculates bounded per-type windows, queries only the selected slices with stable ordering, and renders XML.
- `DEP-001` — PASS. `sitemap-data.ts` uses existing Drizzle read patterns (`$count`, `select`, predicates, `orderBy`, `limit`, `offset`) and performs no writes.
- `DEP-002` — PASS. Product, blog, and brand mappings match existing public routes. `src/app/(marketing)/shop/layout.tsx` declares `/shop` canonical; the contract’s canonical-safe decision therefore excludes category filter URLs.
- `DEC-001` — PASS. The implementation uses a single shard through 50,000 entries and shards at 50,001; selected windows remain bounded.
- `INT-001` — PASS. `/sitemap.xml` returns an XML index and `/sitemap/[id].xml` returns XML URL sets. Database failures propagate rather than being converted into partial sitemap output.

## Security and Integration Review

- `SEC-001` — PASS. The public sitemap is read-only and applies explicit live-state predicates. No credentials, writes, migrations, dependencies, external calls, or production configuration changes are in the reviewed range.
- Search-crawler integration is PASS: XML output uses `application/xml; charset=utf-8`, dynamic URL values are XML-escaped, and noncanonical category filter variants are excluded under the approved decision.

## Scope and Drift Review

`NO_DRIFT`. The implementation is limited to sitemap routing, data sourcing, XML/shard helpers, tests, and the approved `SPEC.md` canonical-safe collection decision. The decision directly resolves the original collection wording without adding a public route or changing a security boundary: current category URLs are noncanonical `/shop?categoryId=...` filters, and `/shop` is emitted once. The user-confirmed intentional sibling Phase One work is not treated as drift.

## Test Expectation Review

- `TEXP-001` — PARTIAL. `src/lib/seo/sitemap.test.ts` statically covers fixed URLs, public-state exclusions, timestamps, canonical query exclusion, and XML rendering, but uses a fake `SitemapDataSource` rather than an isolated database-backed route/output test.
- `TEXP-002` — PASS. Tests verify the 50,000/50,001 threshold and that only selected bounded product/blog/brand windows are requested.
- `TEXP-003` — PASS. Tests preserve the canonical `/shop` representation, reject category query variants, and validate XML escaping.

## Findings

### REV-001

- Severity: LOW
- Category: test
- Description: The required integration coverage is represented by a deterministic fake data source rather than a database-backed sitemap route/output test.
- Evidence: `TEXP-001`; `src/lib/seo/sitemap.test.ts` exercises `loadSitemapShard` with an in-memory `SitemapDataSource`; no database fixture or route-level integration test is in the reviewed range.
- Impact: Static tests prove filtering, rendering, and shard behavior but do not independently demonstrate that production Drizzle rows and sitemap output reconcile.
- Recommendation: Before SEO Phase One release verification, add an isolated database integration or deployment smoke check that compares eligible-record counts with sitemap output.

## Decisions Requiring Attention

None. `DEC-001` is resolved, and the canonical-safe collection decision is approved in `SPEC.md` and implemented consistently.

## Final Recommendation

Accept REN-217 without governance re-entry. There are no blocking findings. Track `REV-001` as a non-blocking release-verification action; REVIEW performed no implementation changes and did not execute application tests.
