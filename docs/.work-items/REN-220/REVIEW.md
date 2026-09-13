# REVIEW: REN-220 — [SEO][P2] Complete Missing Structured Data (Organization/WebSite/BlogPosting)

## Executive Result

`REVIEW_PASSED_WITH_FINDINGS` — `NO_DRIFT`. Compared `main` base `10deb69fe8afb2f4ebcbc68cf5d8fb9e757c1d6e` to head `303a0c87b55e9725ec237350a18314c512ca2ad8`; PR URL: `null`. Governance re-entry is not required. Static reconciliation is complete, but `TEXP-001` Rich Results Test evidence has not been attached or otherwise supplied.

## Review Scope and Git Evidence

The requested task-scoped range resolves to the exact commits above on `feat/seo-phase-1-complete`. The range contains 44 changed paths (2,892 additions and 518 deletions). Its combined SEO-phase sibling changes are intentional per review direction and are not classified as REN-220 drift.

REN-220 evidence is in `src/app/layout.tsx` (`RootLayout` site-identity script), `src/app/(marketing)/blogs/[slug]/page.tsx` (`BlogFetch`), `src/config/site.ts` (`siteSocialProfileUrls`), `src/lib/seo/structured-data.ts` (`buildSiteIdentityJsonLd`, `buildBlogPostingJsonLd`, `serializeJsonLd`), `src/lib/db/queries/blog.ts` (`getPublishedBlog`), and `src/lib/seo/structured-data.test.ts`. Product and shop files in the range contain canonical/heading sibling changes only; Product/Breadcrumb JSON-LD code remains present and is not modified by REN-220.

The worktree had pre-existing uncommitted governance changes for REN-215, REN-216, REN-217, REN-219, and REN-220 before this review update. They are excluded from the commit-range implementation evidence.

## Requirement Reconciliation

- `REQ-001` — PASS. `RootLayout` renders one server-side `application/ld+json` script from `buildSiteIdentityJsonLd`; its graph contains exactly `Organization` and `WebSite`. Identity fields come from `siteConfig` and `getAbsoluteURL()`. `siteSocialProfileUrls` derives the configured HTTPS Instagram, LinkedIn, and YouTube URLs from the footer. No logo source exists in `siteConfig`, so no logo field is fabricated.
- `REQ-002` — PASS. `BlogFetch` obtains a published record through `getPublishedBlog`, builds `BlogPosting` from stored title, description, dates, image, and author fields, and renders it as a server-component JSON-LD script.
- `REQ-003` — PASS. The Product page still uses its existing `buildBreadcrumbJsonLd` and Product scripts; its only range change is canonical metadata. The newly added schemas contain no Product, Offer, BreadcrumbList, `aggregateRating`, or `review` fields.

## Scenario Reconciliation

- `SCN-001` — PASS. Homepage layout output contains the configured Organization/WebSite identity graph, including existing social profiles.
- `SCN-002` — PASS. A published slug route obtains only a published blog and emits its BlogPosting payload; unpublished records return `notFound` before rendering.
- `SCN-003` — PASS. `SearchAction` is absent (`DEC-001`); Product/Breadcrumb behavior remains intact and ratings/reviews are absent.

## Invariant Reconciliation

- `INV-001` — PASS. Both payloads are rendered by server components. Blog fields are serialized with `<` escaped to `\\u003c`; the site-identity payload consists of static, repository-controlled configuration values. `structured-data.test.ts` covers published/unpublished handling, optional fields, configured social URLs, and serialization escaping.
- `INV-002` — PASS. No Product/Breadcrumb JSON-LD hunk was changed for REN-220; range changes there are only sibling canonical metadata.

## Flow and Architecture Review

- `FLOW-001` — PASS. `DEP-001` site configuration flows through the root layout to crawler-visible JSON-LD, while `DEP-002` published blog data flows through `BlogFetch` and `buildBlogPostingJsonLd` to its server-rendered script. The shared builder is additive and does not alter existing schema interfaces.
- `PER-001` — PASS. Search-engine consumers receive crawler-visible server HTML, rather than client-side schema injection.

## Security and Integration Review

- `BR-001` — PASS. The payloads source configured identity and stored published-blog fields only; `buildBlogPostingJsonLd` omits absent optional fields and no rating, review, fabricated author, or fabricated date is emitted. Blog script serialization escapes a closing-script delimiter. Organization social URLs are configuration-backed rather than invented.
- `DEC-001` — PASS. `SearchAction` is not emitted; no verified search URL-parameter contract was added.
- Integrations — NOT_APPLICABLE. The approved contract has no `INT-*` integration IDs or external runtime API dependency. Rich Results validation remains an external acceptance-evidence action under `TEXP-001`, not an implementation integration.

## Scope and Drift Review

`NO_DRIFT`. The Organization/WebSite, BlogPosting, social-profile derivation, published-blog visibility guard, builder, and static tests implement the approved scope. The wider range includes intentional sibling SEO-phase work (sitemaps, headings, canonicals, and ItemList); review direction explicitly identifies it as combined-phase work, so it is neither REN-220 scope creep nor drift.

## Test Expectation Review

- `TEXP-001` — PARTIAL. `src/lib/seo/structured-data.test.ts` statically verifies the Organization/WebSite and BlogPosting builders, but no homepage and real published-blog Rich Results Test result is attached to Linear or supplied in the review evidence. REVIEW did not execute tests.
- `TEXP-002` — PASS. Static diff and test inspection confirm unsupported fields are absent and Product/Breadcrumb JSON-LD code was not modified by this task.

## Findings

### REV-002

- Severity: LOW
- Category: test
- Description: Required external Rich Results Test evidence for the homepage and one real published blog post is not available to this review.
- Evidence: `TEXP-001`; Linear REN-220 has no attachments or comments; static builder tests in `src/lib/seo/structured-data.test.ts` are not external Rich Results Test results.
- Impact: Schema conformance in Google's validator remains unconfirmed before release.
- Recommendation: Run the Rich Results Test against the deployed or preview homepage and one real published `/blogs/[slug]` page, then attach the results to the issue or PR.

## Decisions Requiring Attention

None.

## Final Recommendation

Accept the implementation as `REVIEW_PASSED_WITH_FINDINGS`; no governance re-entry is needed. Complete `REV-002` / `TEXP-001` by attaching Rich Results Test evidence before release. No blocking findings.
