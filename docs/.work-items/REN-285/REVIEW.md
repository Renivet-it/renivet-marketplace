# REVIEW: REN-285 — Manage Mobile Homepage Banners and Highlight ReWear

## Executive Result

**REVIEW_PASSED_WITH_FINDINGS** — `NO_DRIFT`; base `master` at `bf2998d0e3c074be9c1913b567b63a58adb519c1`, head `952c41f6` (full commit recorded in work-item.yaml). Governance re-entry is not required. One non-blocking verification gap remains for live UploadThing and database migration integration.

## Review Scope and Git Evidence

- Linear issue: REN-285, “Manage Mobile Homepage Banners and Highlight ReWear,” In Progress; branch metadata matches `ayanganguly333/ren-285-manage-mobile-homepage-banners-and-highlight-rewear`.
- Contract gate: `docs/.work-items/REN-285/work-item.yaml` is `READY_FOR_DEV`, `APPROVED`, with no design blockers and an L2 Critic gate completed. `bun run governance:validate -- docs/.work-items/REN-285/work-item.yaml` passed before review.
- Compared `origin/master` (`bf2998d0e3c074be9c1913b567b63a58adb519c1`) to implementation commit `952c41f6` (full SHA in YAML). Implementation changes are committed; the review artifact and review result are being recorded separately.
- Reviewed the migration/schema/query/router/admin form, media recovery helpers, homepage composition and responsive components, supplied artwork, and relevant tests.

## Requirement Reconciliation

- `REQ-285-001`: PASS — mobile admin list/create routes and shared banner form support mobile placement, title, description, image, destination, activation, edit, and delete (`src/app/(protected)/dashboard/general/banners/mobile/page.tsx`, `mobile/new/page.tsx`, `src/components/globals/forms/banner-manage.tsx`).
- `REQ-285-002`, `REQ-285-004`: PASS — `is_mobile` defaults false; migration `drizzle/0268_mobile_banner_placement.sql` adds the column and inserts six active mobile slides; schema and queries carry placement (`src/lib/db/schema/content.ts`, `src/lib/db/queries/banner.ts`).
- `REQ-285-003`: PASS — homepage loads active mobile records separately and supplies them to the mobile carousel; configured URLs are used (`src/app/(home)/page.tsx`, `src/components/home/landing.tsx`).
- `REQ-285-005`: PASS — browser compression accepts PNG/JPEG sources up to 20 MiB and enforces 3.75 MiB output before upload; PNG alpha is preserved and failures stop submission (`src/lib/image-compression.ts`, shared banner form).
- `REQ-285-006`: PASS — accessible NEW badge and mobile-only `/rewear` card use the supplied images and `font-sans` (`src/components/globals/layouts/navbar/navbar-home.tsx`, `src/components/home/rewear-mobile-cta.tsx`).
- `REQ-285-007`: PASS — the mobile Shop By Category block was removed from `SwapSpace`; the page-level category fetch is absent; desktop category presentation is outside the removed mobile markup.
- `REQ-285-008`: PASS — mutation routes retain `MANAGE_CONTENT` protection and placement-specific filtering keeps desktop and mobile banner paths separate (`src/lib/trpc/routes/general/content.ts`, desktop and mobile admin pages).
- `REQ-285-009`, `REQ-285-010`: PASS — persistence failure compensates for new uploads; old media is deleted after row/cache operations; mobile read errors are logged and isolated (`src/lib/banner-recovery.ts`, banner router, homepage loader).

## Scenario Reconciliation

- `SCN-285-001`–`SCN-285-004`, `SCN-285-008`: PASS — admin CRUD and read filtering, desktop default/migration seed, and protected mutation paths are present in the router, schema, migration, and admin pages.
- `SCN-285-005`: PASS — compression threshold, supported formats, alpha-preserving path, processing failure handling, and upload-size feedback are implemented in the shared form and compression helper.
- `SCN-285-006`–`SCN-285-007`: PASS — ReWear card is mobile-only, points to `/rewear`, uses supplied assets/site font; mobile category block is absent.
- `SCN-285-009`–`SCN-285-010`: PASS — DB/media ordering, compensation, cleanup logging, and mobile-query isolation have focused fault-injection tests.

## Invariant Reconciliation

- `INV-285-001`–`INV-285-004`: PASS — desktop default and placement filters are wired through the migration/schema/query/router; mutations retain existing authorization; the form only uploads compressed output within its limit.
- `INV-285-005`: PASS — card markup is hidden at desktop breakpoints, uses a named link and `/rewear`; mobile category markup is removed.
- `INV-285-006`: PASS — helper/router sequencing leaves database references authoritative and catches mobile query failures without suppressing cached desktop banners.

## Flow and Architecture Review

- `FLOW-285-001`: PASS — admin list/create routes feed shared placement-aware form, protected tRPC mutations, cache handling, and public placement-filtered reads.
- `FLOW-285-002`: PASS — additive migration adds a false default before runtime reads and seeds the six existing slides.
- `FLOW-285-003`: PASS — homepage loads mobile records independently, renders ReWear discovery at the requested position, and preserves desktop banner cache rendering on mobile-read failure.
- `DEP-285-001`–`DEP-285-003`, `INT-285-001`–`INT-285-002`: PASS by static contract inspection. UploadThing failures block oversized upload; cache operations remain behind existing helpers. Live provider enforcement and deployment migration behavior are not demonstrated in this repository review (see REV-001).

## Security and Integration Review

- `SEC-285-001`: PASS — banner create/update/status/delete remain in the existing protected banner router; public banner reads remain read-only.
- `SEC-285-002`: PASS — browser-side format/size checks do not add credentials or change authorization; upload failure is surfaced to the admin.
- UploadThing integration: PASS for local request construction and failure behavior by static inspection; live provider enforcement remains unverified (REV-001).
- Redis/cache integration: PASS — cache changes occur through existing helpers; media cleanup follows committed row/cache state.

## Scope and Drift Review

- `NO_DRIFT`: all changes map to approved mobile banners, image compression, ReWear badge/card, mobile category removal, and media/query recovery requirements. No changes to ReWear pickup-request workflow, login behavior, or notifications were found; these are excluded from this issue.
- Migration remains additive and desktop placement retains the false default. No new package or authorization boundary was added.

## Test Expectation Review

- `TEXP-285-001`: PASS — `tests/mobile-banner-placement.test.ts` and banner router/authorization implementation inspected.
- `TEXP-285-002`: PARTIAL — migration and compression helper have focused tests/static coverage, but no live database migration or UploadThing provider integration result is included.
- `TEXP-285-003`: PASS — `tests/banner-image-compression.test.ts` and `tests/mobile-banner-placement.test.ts`; shared form implements feedback and submit blocking.
- `TEXP-285-004`: PASS — `tests/rewear-mobile-home-cta.test.ts` checks mobile-only routing and category removal; supplied assets and `font-sans` are referenced by the component.
- `TEXP-285-005`: PARTIAL — navigation/card accessible names and form feedback are present; this review did not establish keyboard focus and assistive-technology behavior in a browser.
- `TEXP-285-006`: PASS — desktop filtering and regression behavior inspected; `tests/rewear-nav-badge.test.ts` and banner placement/recovery tests cover focused changes.
- `TEXP-285-007`: PASS — `tests/banner-failure-recovery.test.ts` covers persistence compensation, post-commit cleanup failure, and mobile read isolation.
- The implementer ran the focused suite (15 passed) and full `bun test` (896 passed, 4 skipped, 0 failed) before this static review; REVIEW itself did not execute tests.

## Findings

### REV-001

- Severity: LOW
- Category: test
- Description: Live database migration and UploadThing provider enforcement, plus keyboard/screen-reader interaction, are not established by repository tests or this static review.
- Evidence: `TEXP-285-002` and `TEXP-285-005` require integration/accessibility evidence; repository tests cover local compression, placement, card markup, and fault-injection only.
- Impact: A provider byte-limit mismatch or browser-only accessibility issue could appear after deployment despite local checks passing.
- Recommendation: Verify the migration and upload ceiling in a deployment-like environment, and perform keyboard/screen-reader checks before release.

## Decisions Requiring Attention

None.

## Final Recommendation

`REVIEW_PASSED_WITH_FINDINGS`; drift is `NO_DRIFT`, blocking findings are empty, and governance re-entry is not required. Track REV-001 as a non-blocking release verification action. Apply the additive database migration before deploying application code that reads `is_mobile`.
