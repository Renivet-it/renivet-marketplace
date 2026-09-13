# REVIEW: REN-219 — [SEO][P1] Shared H1 + Canonical Framework

## Executive Result

`REVIEW_PASSED_WITH_FINDINGS` — `NO_DRIFT`. Compared `main` base `8914b7391ef4a6f6e00142407075fa0193be7ed4` with head `303a0c87b55e9725ec237350a18314c512ca2ad8`; PR URL is `null`. Governance re-entry is not required. Pre-existing uncommitted worktree changes were present before review, including governance artifacts; they are excluded from this commit comparison.

## Review Scope and Git Evidence

The requested comparison is `8914b7391ef4a6f6e00142407075fa0193be7ed4..303a0c87b55e9725ec237350a18314c512ca2ad8` on `feat/seo-phase-1-complete`. It changes 44 paths (2,319 insertions, 511 deletions). Per the supplied instruction, it is an intentional combined SEO phase: sibling sitemap, festive, schema, and other task artifacts are not scope drift for REN-219. Review inspection is limited to the REN-219 heading/canonical framework, its static tests, and the minimum surrounding route/query behavior.

Observed implementation evidence: commit `062ba91e2` adds the six section-heading demotions, root/shop H1 owners, clean canonical metadata, `scripts/seo/validate-heading-usage.ts`, and `tests/seo-metadata-headings.test.ts`; commit `4507015b0` completes the homepage guard composition; commit `303a0c87b` retains those heading/canonical fixes while closing sibling phase gaps. `git diff --check` reports no whitespace errors in the requested range.

## Requirement Reconciliation

- `REQ-001`: PASS. `src/app/(home)/page.tsx` owns the single root H1. The six required sources — `discount-section.tsx`, `everyday-essential.tsx`, `shop-slow.tsx`, `top-collection.tsx`, `new-collection.tsx`, and `product-new-arrival.tsx` — each change their former H1 to H2. `scripts/seo/validate-heading-usage.ts` composes exactly these sources for `/` and fails if their total H1 count is not one.
- `REQ-002`: PASS. `src/app/(marketing)/shop/layout.tsx` sets `canonical: getAbsoluteURL("/shop")`, independent of request search parameters. `src/app/(marketing)/products/[slug]/page.tsx` uses the clean product slug URL, and `src/app/(marketing)/blogs/[slug]/page.tsx` uses the clean blog slug URL.
- `REQ-003`: PASS. `DEP-001` is respected: `src/app/(marketing)/shop/page.tsx` supplies the shop H1 through `StorefrontCatalogPage` without altering catalog query handling. `DEP-002` is respected: the existing homepage, festive, discover, and brand-shop canonical owners remain unchanged in the comparison. `BR-001` is met because `searchParams` remains the catalog input while the canonical is fixed at `/shop`.

## Scenario Reconciliation

- `SCN-001`: PASS. Static composition evidence in the guard and `tests/seo-metadata-headings.test.ts` shows one homepage H1 and six non-root section headings.
- `SCN-002`: PASS. The three target metadata paths produce param-free canonical targets; the layout-level shop canonical therefore applies equally to filtered, sorted, and paginated shop requests.
- `SCN-003`: PASS. Existing canonical declarations are unchanged and shop filtering/navigation remains query-driven. No changed route transition or canonical conflict was observed.

## Invariant Reconciliation

- `INV-001`: PASS. The executable guard counts the full `/` composition and separately verifies `/shop` plus the dynamic H1 owner for `/festive`; the static tests inspect the same ownership model.
- `INV-002`: PASS. Canonical targets are deterministic: `/shop` is fixed, while product and blog targets derive only from their route slug. No query value participates in a canonical target and no routing behavior changes.

## Flow and Architecture Review

- `FLOW-001`: PASS. The approved flow is implemented as scoped source guard plus page/layout metadata owners, producing crawler-visible semantics without introducing a new public interface or dependency.
- `DEC-001`: PASS. The approved executable scoped source-guard option is implemented by `scripts/seo/validate-heading-usage.ts`, its targeted fixture test `scripts/seo/validate-heading-usage.test.ts`, and the `seo:validate-headings` package script. The guard covers the six enumerated homepage components and route owners rather than merely fixing current markup.

## Security and Integration Review

There are no `SEC-*` contract IDs; security is `NOT_APPLICABLE` with contract evidence that this is markup/metadata-only work. `INT-001`: PASS by static evidence. The H1 and canonical signals are emitted through rendered React markup and Next Metadata for crawler consumption. No authentication, authorization, tenant boundary, secret, external request, or integration retry behavior changes. `PER-001` is supported by the resulting single primary heading and clean canonical targets.

## Scope and Drift Review

`NO_DRIFT`. The inspected implementation is within the approved heading/canonical framework and preserves the exclusions: it does not independently change the shop H1 ownership already coordinated through `DEP-001`, introduce category URL migration, add ItemList work for shop, or define a faceted noindex policy. The rest of the requested range is intentional sibling work in the combined phase, as directed, not REN-219 drift.

## Test Expectation Review

- `TEXP-001`: PASS for static coverage. `tests/seo-metadata-headings.test.ts` checks the root H1, all six demotions, and route H1 owners. `scripts/seo/validate-heading-usage.test.ts` statically demonstrates that a bare H1 reintroduced in each enumerated section causes the guard to fail.
- `TEXP-002`: PARTIAL. Static tests assert clean shop/product/blog canonical source construction, but this read-only review did not execute rendered view-source/crawl validation for two shop query variants.
- `TEXP-003`: PARTIAL. Comparison inspection confirms existing canonical owners and unchanged catalog query flow, but the required rendered regression check was not run.

No application test suite, crawl, or browser/view-source check was executed by REVIEW.

## Findings

### REV-001

- Severity: LOW
- Category: test
- Description: Required rendered route and multi-query canonical validation remains unexecuted.
- Evidence: `TEXP-002` and `TEXP-003` require a crawl or manual view-source validation. This review inspected `tests/seo-metadata-headings.test.ts` and `scripts/seo/validate-heading-usage.test.ts` statically and did not run application tests or browser checks.
- Impact: Source inspection cannot prove emitted HTML for filtered/paginated shop variants or the complete rendered route set.
- Recommendation: Before release, perform the approved crawl or manual view-source validation for homepage, shop, festive, product, and blog, including at least two filtered/paginated shop URLs.

## Decisions Requiring Attention

None.

## Final Recommendation

Accept the implementation as contract-consistent with `NO_DRIFT`; no governance re-entry is required. Resolve `REV-001` with the approved rendered crawl/view-source evidence before release.
