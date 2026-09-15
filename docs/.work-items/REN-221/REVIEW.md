# REVIEW: REN-221 — Category URL Migration to /shop/[category-slug]

## Executive Result

REVIEW_PASSED_WITH_FINDINGS with NO_DRIFT. Base and head are both `a592e86f0ecdfe36e27f1fa538fa1996d018af81`; the reviewed implementation is currently uncommitted in the working tree. Governance re-entry is not required.

## Review Scope and Git Evidence

Reviewed the approved REN-221 contract against the complete working-tree diff from `origin/master` on branch `feat/ren-221`. Scope includes the slug route, legacy middleware redirect, internal lookup endpoint, category URL/content/telemetry helpers, catalog integration, category mutations, navigation/search/home links, breadcrumbs, metadata, and task-focused tests. No PR URL exists.

## Requirement Reconciliation

- REQ-221-001: PASS — `src/app/(marketing)/shop/[category-slug]/page.tsx` resolves category slugs and delegates to `StorefrontCatalogPage`.
- REQ-221-002: PASS — redirect mode and status helpers explicitly map off/temporary/permanent to unchanged/307/301 behavior; query cloning preserves ordered values.
- REQ-221-003: PASS — category-aware navigation, breadcrumbs, product pages, search, banners, mobile categories, and landing links use slug URLs; the link-audit test covers required hard-coded home consumers.
- REQ-221-004: PASS — slug metadata self-canonicalizes; SPEC.md explicitly defers REN-217 sitemap consumption until the route is deployed and coordinates REN-219 through the shared builder; redirect mode provides rollback.
- REQ-221-005: PASS — legacy eligibility rejects duplicates, malformed UUIDs, category conflicts, either subcategory alias, and alias conflicts; lookup failures fail open.
- REQ-221-006: PASS — middleware uses a fixed same-origin secret-protected lookup with 250 ms abort and bounded closed telemetry.
- REQ-221-007 and REQ-221-008: PASS — canonical slug and hierarchy validation reject malformed, unknown, differently cased, aliased, duplicate, and mismatched combinations.
- REQ-221-009: PASS — category rename preserves the existing slug.
- REQ-221-010: PASS — the internal lookup path bypasses Clerk and redirect processing before authentication logic while the handler requires its token.
- REQ-221-011: PASS — category deletion checks slug/dependencies before delete and returns a typed conflict with bounded telemetry.
- REQ-221-012: PASS — category title, description metadata, visible H1, and tested 150–300 word category/fallback editorial copy render before catalog content.

## Scenario Reconciliation

SCN-221-001 through SCN-221-011 are represented by implementation branches and focused static/unit coverage. Redirect modes, exact query preservation, hierarchy matching, invalid slug handling, slug-stable rename, lookup security boundaries, deletion guard, editorial bounds, and canonical H1 ownership are present. Real staging product-type parity and rollback rehearsal remain external evidence work under REV-221-005.

## Invariant Reconciliation

INV-221-001 through INV-221-007: PASS. Product-type identity remains in the destination query; legacy `/shop` remains available; middleware imports no database/cache client; hierarchy filters are checked against the path category; rename preserves slug; and blocked deletion performs no delete/cache invalidation.

## Flow and Architecture Review

FLOW-221-001 through FLOW-221-005: PASS. The implementation follows the approved middleware → bounded internal lookup → cloned URL → slug route → shared catalog flow, with fail-open behavior and an off-mode rollback. DEP-221-001 through DEP-221-005 and INT-221-001/002 are reflected in the route, builder, link inventory, telemetry, and explicit sitemap/canonical handoff.

## Security and Integration Review

SEC-221-001: PASS by static evidence. The lookup accepts only UUIDs, requires a server secret, returns bounded public identifiers, applies a 200 ms database statement timeout, and is aborted by middleware at 250 ms. Telemetry excludes identity and arbitrary query values. Anonymous/authenticated parity follows from redirect handling before `auth()`.

## Scope and Drift Review

NO_DRIFT. Changes stay within the approved URL migration, category safety, internal-link, metadata, observability, and test surfaces. Product URLs, data schema, production settings, and external side effects are unchanged.

## Test Expectation Review

TEXP-221-001 through TEXP-221-008 and TEXP-221-010 through TEXP-221-012 have direct static or focused automated coverage across URL eligibility, hierarchy, status mapping, query preservation, telemetry shape, editorial length, link audit, H1 ownership, metadata implementation, security boundaries, rename, and deletion paths. TEXP-221-009 is PARTIAL because three-real-product-type staging evidence and rollback rehearsal cannot be produced from the local repository alone. The focused REN-221/SEO/search/sitemap suite passed. The repository-wide suite retains unrelated environment/dependency failures, and the repository-wide type-check retains unrelated baseline errors; filtered REN-221 paths report no type errors.

## Findings

### REV-221-005

- Severity: MEDIUM
- Category: test
- Description: Real staging acceptance evidence is not available in the repository.
- Evidence: TEXP-221-005 and TEXP-221-009 require three real product types, temporary-mode parity, UTM survival, observability baseline links, and rollback rehearsal.
- Impact: Production permanent-mode rollout cannot be approved solely from local evidence.
- Recommendation: Before setting `CATEGORY_SLUG_REDIRECT_MODE=permanent`, archive staging evidence for three real product types, UTM preservation, parity, saved observability queries, and off-mode rollback.

### REV-221-006

- Severity: LOW
- Category: test
- Description: Repository-wide checks are not completely green because of pre-existing environment/dependency and type-check failures outside REN-221.
- Evidence: `bun test` reports failures in environment-initialized analytics/festive tests and a missing local React PDF dependency; the full TypeScript check reports broad unrelated baseline errors, while filtered REN-221 paths are clean.
- Impact: Global green-CI evidence must come from the repository baseline or CI environment.
- Recommendation: Track the unrelated baseline failures separately; keep REN-221 focused checks required in CI.

## Decisions Requiring Attention

DEC-221-004 and DEC-221-008 remain operational: permanent redirects require successful staging/canary evidence and owner approval. No new implementation decision is required.

## Final Recommendation

The implementation is ready for commit and PR review, with no material drift. Do not enable permanent redirects until REV-221-005 staging acceptance and rollback evidence is attached. Track REV-221-006 separately as repository baseline debt.
