# REN-221 — Category URL migration

## Outcome

Introduce stable keyword-bearing `/shop/[category-slug]` category pages while preserving the exact filtering semantics of existing UUID query URLs. The migration protects indexed URLs, paid landing pages, UTM attribution, analytics, internal links, canonical metadata, sitemap coordination, and rollback safety.

## Approved behavior

- `categories.slug` is the authoritative public category identity. The current schema has no visibility or tenant state, so every category row is public for this migration.
- A legacy `/shop?productTypeId=<uuid>` request resolves the product type's parent category. Redirect mode `off` leaves it untouched, `temporary` returns 307, and `permanent` returns 301 to `/shop/<category-slug>?productTypeId=<uuid>`.
- Retaining `productTypeId` is mandatory because it preserves the narrower product-type filter. It is removed only when invalid or unknown, in which case no redirect occurs and the legacy route handles the request.
- Existing category slugs are used as-is. REN-221 performs no slug backfill, rename, or historical-slug migration. A later slug edit requires its own old-slug redirect plan.
- Redirect only when there is exactly one `productTypeId` and none of `categoryId`, `subCategoryId`, or legacy alias `subcategoryId` is present. Duplicate IDs, either subcategory spelling, both spellings together, and mixed hierarchy filters fail open unchanged.
- Preserve original query ordering and encoding by cloning the request URL and changing only the pathname. No redirect runs when the pathname is already `/shop/<slug>`.
- Slugs are exact, lowercase, database-generated values. Unknown, malformed, differently cased, or non-canonical encoded slugs return the standard 404 and must not emit indexable category metadata.
- On `/shop/<slug>`, the path category is authoritative. `categoryId` may be absent or equal it; either `subCategoryId` or `subcategoryId` may be supplied (not both) and must resolve within it; `productTypeId` must resolve within it and any supplied subcategory. Any duplicate, alias conflict, or hierarchy mismatch returns the same non-indexable 404. Matching filters remain and canonical metadata points to the slug path without filter parameters.
- Once slug URLs are available, category-name edits no longer regenerate existing category slugs. Category creation still generates a unique slug. Any future slug edit requires a separate explicit operation with historical redirects.

## Architecture contract

- Add `/shop/[category-slug]` as a server-resolved route and render the existing storefront catalog through shared route input so filtering, pagination, sorting, search, and analytics remain intact.
- Middleware performs a bounded same-origin fetch to a Node-runtime internal lookup route. That route reads the authoritative database, validates `productTypes.categoryId`, resolves the current category slug, and returns only the public slug or a bounded failure code. Middleware itself never imports database or Redis clients.
- `productTypes.categoryId` is authoritative. The lookup additionally verifies that `productTypes.subCategoryId -> subCategories.categoryId` agrees; inconsistent rows return `inconsistent_hierarchy` and fail open.
- The lookup route executes one indexed database join without Redis, sets a transaction-local 200 ms PostgreSQL `statement_timeout`, observes the request abort signal before and after the query, and returns no result after disconnect. Middleware aborts the same-origin fetch at 250 ms. Timeout, database failure, malformed response, unknown ID, or hierarchy inconsistency calls `NextResponse.next()` with the untouched request.
- The internal route is force-dynamic and returns `Cache-Control: private, no-store, max-age=0`; middleware fetch uses `cache: no-store`. Successful and failed lookups never enter framework, browser, or CDN caches.
- The lookup endpoint accepts only UUID input and requires a constant-time checked `x-renivet-internal-lookup-token` matching a server secret available to middleware and Node runtime. Missing/invalid tokens return 404. It returns only public IDs/slugs and is addressed through a fixed same-origin URL; it is not a public API and requires no client-IP rate limiter.
- Middleware excludes the fixed internal lookup pathname before Clerk/authentication and redirect logic, preventing recursion. The route token remains mandatory, and anonymous/authenticated storefront callers receive identical lookup behavior.
- Middleware handles only exact `/shop` requests meeting the single-ID/no-conflict rule. Redirect construction changes only the pathname and returns 307 in temporary mode or 301 in permanent mode.
- Add `src/lib/shop/category-url.ts` as the single builder for category slug paths. REN-221 owns route metadata and scoped internal-link migration. REN-217 consumes this builder for sitemap entries; REN-219 consumes it for canonical consistency. Their absence does not block route implementation, but sitemap publication must not precede a deployed slug route.
- Category-only links in storefront breadcrumbs, product breadcrumbs, global navbar, home category banners, mobile category navigation, and search navigation migrate to the builder. Links intentionally carrying `subCategoryId` or `productTypeId` keep those filters and use the parent category slug when parent data is available. Product URLs and unrelated promotional links are excluded.
- Use `CATEGORY_SLUG_REDIRECT_MODE=off|temporary|permanent` (server-only, default `off`). `temporary` returns 307 for staging/canary; `permanent` returns 301 only after acceptance. The slug route and slug-based internal links remain available in every mode, so no client flag propagation or hydration split exists. Rollback before permanent mode sets `off`; after 301 release, rollback can stop new redirects but cannot recall cached redirects, so slug routes must remain backward compatible.
- Redirect mode never controls internal-link generation. Slug routes and slug links stay enabled; `off` only stops new legacy redirects while `/shop` remains compatible.
- Each slug page emits category title, description, H1, and a 150–300 word editorial introduction before the catalog. It uses valid category description content or deterministic approved fallback copy.
- The internal token is `CATEGORY_SLUG_LOOKUP_TOKEN`. Missing or empty configuration disables lookup and redirects and never falls back to a default token.

## Observability and rollout

- Event emission is exhaustive, not sampled. Emit exactly one outcome for each migration-relevant request: exact `/shop` containing `productTypeId`, the internal lookup, or `/shop/<slug>`.
- `category_slug_redirect` outcomes are `redirected`, `fail_open`, or `bypassed`; closed reasons are `mode_off`, `duplicate_product_type`, `category_conflict`, `subcategory_alias_conflict`, `invalid_uuid`, `unknown_product_type`, `inconsistent_hierarchy`, `lookup_timeout`, `lookup_error`, `invalid_lookup_response`, and `success`.
- `category_slug_route` outcomes are `rendered`, `not_found`, or `error`; closed reasons are `success`, `invalid_slug`, `unknown_slug`, `duplicate_filter`, `hierarchy_mismatch`, `category_deleted`, and `server_error`.

- Emit bounded structured Vercel logs for every request: `category_slug_redirect` (eligible, redirected, fail_open, bypassed) and `category_slug_route` (rendered, not_found, error). Include enumerated reason, status, product type/category public IDs or slug, deployment/environment, and destination pathname—never identity or arbitrary query values.
- In Vercel Observability, the SEO/operator owns saved queries grouped into 15-minute windows. Redirect failure rate is `fail_open / (redirected + fail_open)`; slug error rate is `(not_found + error) / all category_slug_route events`; legacy volume is eligible `/shop` events. A zero denominator produces no rate and no automatic comparison. Capture a 24-hour pre-enable legacy error baseline and archive query links with staging evidence.
- Staging acceptance requires the specified tests, zero redirect loops, exact filter parity for at least three real product types, and successful rollback rehearsal.
- Production enablement requires successful temporary-mode staging/canary evidence and owner approval before switching to permanent mode. Return to `off` immediately for any loop, mapping mismatch, lost attribution parameter, or slug error rate exceeding the prior 24-hour baseline by either 0.5 percentage points or 2x (when baseline is non-zero) for two consecutive 15-minute windows. After permanent mode, maintain slug-route compatibility even when redirects are disabled.

## Required verification

- Automated tests use fixed category/subcategory/product-type fixtures, including a deliberately inconsistent hierarchy. Staging acceptance additionally samples at least three real product types.
- Verify 301 status, authoritative parent category slug, retained product type filter, UTM/query preservation, canonical output, analytics identity, and catalog-result parity.
- Verify malformed, unknown, duplicate/conflicting IDs, mixed hierarchy filters, encoded parameters, invalid/cased slugs, lookup timeout/failure, and slug-route requests all behave exactly as specified without loops.
- Audit navigation, breadcrumbs, and product category links to ensure category links use the shared slug URL builder while product URLs are unchanged.
- Use `LINK-INVENTORY.md` as the deterministic internal-link migration scope and test each required/conditional consumer listed there; opaque database/CMS URLs are data-owned and are not rewritten by REN-221.
- Verify current-database lookup, SQL deadline and abort behavior, fixed-path Clerk/redirect bypass, and absence of Edge database/cache imports.
- Verify REN-217 sitemap and REN-219 canonical handoff contracts, and rehearse redirect disablement in staging.

## Exclusions

REN-221 does not deploy to production, choose a live cutover time, modify existing category slug values, retain historical slugs, change product URLs, alter catalog business rules, or modify paid campaigns. It does decouple category-name edits from automatic slug mutation to protect public URLs.

Published-category deletion is rejected in the authorized mutation before cascade execution when the slug is non-empty or products/subcategories exist. It returns a typed conflict, performs no writes, and emits `category_delete_blocked`. A separate retirement workflow is required for removal.

## Approved category-deletion policy

Reject ordinary deletion of a published category while dependent records or public URL references exist. Do not cascade-delete or silently retire indexed category URLs. A future retirement workflow must define tombstone/redirect behavior separately. The product owner approved this policy on 2026-09-15.
