# REVIEW: REN-193 — Deployment of the brand tab on the landing page

## Executive Result

`REVIEW_PASSED_WITH_FINDINGS` with `NO_DRIFT`. The implementation was compared from `origin/master` at `59975662c6e44e434aefdc1473671c86f14d41d9` to implementation commit `166d40b8fe0d7fd78a2e24f85f9428e56c8e3869`. Governance re-entry is not required.

## Review Scope and Git Evidence

- Linear identity, title, description, status, labels, assignee, project, comment, and relations were retrieved for REN-193 and match `docs/.work-items/REN-193/work-item.yaml`.
- Base branch: `origin/master`; merge base: `59975662c6e44e434aefdc1473671c86f14d41d9`; implementation commit: `166d40b8fe0d7fd78a2e24f85f9428e56c8e3869`; PR: none.
- Reviewed paths are `navbar-home.tsx`, `brand-navigation.tsx`, `storefront-brand-order.ts`, `brands.ts`, and `ren-193-brand-navigation.test.ts`, plus task-local governance artifacts.
- The pre-review governance validation passed while the contract was `READY_FOR_DEV` and `APPROVED`.

## Requirement Reconciliation

- `REQ-193-001` — PASS: `BrandDesktopNavigationItem` adds a BRANDS trigger after the existing department items, renders at most nine real cards, and omits a promotional banner.
- `REQ-193-002` — PASS: `BrandMobileNavigation` exposes an accessible tag button and a bottom `Sheet` using the same preview data.
- `REQ-193-003` — PASS: `AllBrandsDialog` renders the complete ordered active-brand response and filters it with `filterStorefrontBrands`.
- `REQ-193-004` — PASS: `BrandMark` uses `logoUrl` with an initial fallback, while `BrandLink` uses `/brands/${brand.slug}/shop`.
- `REQ-193-005` — PASS: `getStorefrontBrands` is public but selects only `id`, `name`, `slug`, and `logoUrl`, with `brands.isActive = true`.
- `REQ-193-006` — PASS: the change is additive to the shared navbar, reuses existing navigation/dialog/sheet primitives, and introduces no schema, migration, or route changes.

## Scenario Reconciliation

- `SCN-193-001` — PASS: the desktop Radix navigation trigger supports hover/focus and presents nine ordered links plus View All Brands.
- `SCN-193-002` — PASS: the mobile Radix sheet provides managed overlay/focus behavior and the same ordered preview.
- `SCN-193-003` — PASS: the directory includes search and canonical brand-shop links.
- `SCN-193-004` — PASS: the public query enforces active-only rows and an explicit public projection.
- `SCN-193-005` — PASS: ordering compacts missing priorities; missing or failed logos render a usable initial fallback.
- `SCN-193-006` — PASS: existing category items and action links remain in place, with responsive brand controls added at mutually exclusive breakpoints.

## Invariant Reconciliation

- `INV-193-001` — PASS: one public query and `sortStorefrontBrands` feed desktop, mobile, and directory surfaces.
- `INV-193-002` — PASS: no private brand fields are projected.
- `INV-193-003` — PASS: every rendered brand link uses the stored slug and canonical shop path.
- `INV-193-004` — PASS: the preview slices actual sorted results and creates no placeholder priority slots.

## Flow and Architecture Review

`FLOW-193-001` passes: active rows flow through a minimal tRPC projection, one deterministic ordering utility, the two responsive preview surfaces, the searchable directory, and existing public brand routes. `DEP-193-001`, `DEP-193-002`, and `DEP-193-003` are used as approved. There are no new persistence or destructive state transitions.

## Security and Integration Review

`SEC-193-001` passes because the guest procedure uses an explicit four-field projection and active predicate. `INT-193-001` passes: stored logos use the existing Next.js image path and degrade to a text mark after image failure. The implementation adds no credentials, writes, or privileged procedures.

## Scope and Drift Review

The implementation stays within the approved shared-navbar, read-only brand query, ordering, overlay, and navigation scope. No schema, migration, admin, onboarding, production-data, or hero redesign changes were observed. Drift classification is `NO_DRIFT`.

## Test Expectation Review

- `TEXP-193-001` — PASS: unit coverage verifies priority ordering, alphabetical remainder, absent-priority compaction, and normalized search.
- `TEXP-193-002` — PARTIAL: the source-contract test verifies integration markers, public filtering, logo projection, and canonical links, but there is no isolated rendered component test for image failure and navigation callbacks.
- `TEXP-193-003` — PARTIAL: Radix primitives provide the approved focus/escape mechanics and responsive source integration is asserted, but automated keyboard/focus/escape component coverage is absent.
- `TEXP-193-004` — PASS: the test statically guards public-procedure use, active filtering, logo projection, and rejects a protected-procedure substitution.

## Findings

### REV-001

- Severity: LOW
- Category: test
- Description: Automated rendered-component coverage does not directly exercise broken-logo fallback, keyboard focus, Escape dismissal, or sheet-to-directory transitions.
- Evidence: `TEXP-193-002` and `TEXP-193-003`; `tests/ren-193-brand-navigation.test.ts` uses unit and source-contract assertions rather than a mounted DOM test.
- Impact: Regressions in interaction semantics could require browser verification to detect.
- Recommendation: Add a mounted component/accessibility test when the repository standardizes a DOM-capable React test harness.

## Decisions Requiring Attention

None.

## Final Recommendation

Proceed with REN-193. No blocking findings or governance re-entry are required. Track `REV-001` as a non-blocking test-hardening action.
