# REN-285 — Mobile homepage banners and ReWear discovery

## Status

`READY_FOR_DEV`

## Scope

Provide separate administration for mobile homepage banners while preserving
the existing desktop banner workflow. Mobile banners have editable titles,
descriptions, images, destinations, activation, and deletion. The mobile
homepage reads active mobile banner records and follows each configured
destination. The existing six mobile slides are migrated into the database.

The shared desktop/mobile banner form accepts PNG and JPEG source files up to
20 MiB. It keeps files at or below 3.75 MiB unchanged and compresses larger
files to no more than 3.75 MiB before upload, within the provider's 4 MB limit.
PNG transparency must remain intact. Unsupported types, browser processing
failures, and images that cannot meet the output limit produce a clear error.

Improve ReWear discovery with an accessible navigation badge and a mobile-only
home card linking to `/rewear`. The card uses the supplied ReWear artwork and
Renivet's existing Nunito Sans site font (the home card must not force a
separate display font). Remove the broken Shop By Category
block from the mobile home page as requested; leave its desktop presentation
and other home content unchanged.

## Evidence reviewed

- Linear REN-285 title, description, status, priority, labels, branch, relations,
  and comments; no related issues or comments were present.
- User instructions and supplied ReWear visual/assets in this conversation.
- `src/app/(home)/page.tsx`, `src/components/home/landing.tsx`, and
  `src/components/home/rewear-mobile-cta.tsx` for placement, mobile banner
  loading, route destinations, and the updated ReWear card.
- `src/app/(protected)/dashboard/general/banners/*`,
  `src/components/dashboard/general/banners/*`, and
  `src/components/globals/forms/banner-manage.tsx` for desktop/mobile admin
  boundaries and image upload behavior.
- `src/lib/db/schema/content.ts`, `src/lib/db/queries/banner.ts`,
  `src/lib/trpc/routes/general/content.ts`, `src/lib/validations/banner.ts`,
  `src/lib/image-compression.ts`, and `drizzle/0268_mobile_banner_placement.sql`.
- Existing global font declaration in `src/app/globals.css` and Nunito Sans
  setup in `src/app/fonts.ts`.
- Targeted tests for banner placement, compression, ReWear navigation badge,
  and the mobile ReWear card; repository governance and Bun test instructions.

## Current-state findings

1. `home_banners` previously represented desktop banners only. The migration
   adds `is_mobile` with a false default and seeds the six existing mobile
   slides. The default preserves the placement of existing records.
2. Banner queries and the public tRPC read accept a mobile placement selector;
   create/update forms share a schema and upload flow. Mutations are guarded by
   the existing `MANAGE_CONTENT` permission.
3. The homepage mobile carousel must request mobile records explicitly. The
   desktop carousel must continue to request desktop records and preserve its
   existing loading and destinations.
4. Compression runs in the browser via `createImageBitmap` and canvas. Output
   has a 3.75 MiB byte ceiling to leave margin below the 4 MB provider limit.
   Oversized PNGs are resized without lossy re-encoding, preserving alpha.
5. The homepage now has a mobile-only ReWear card. The card's current serif
   classes override the global Nunito Sans face and must be removed to match
   the user's latest typography instruction.
6. The mobile Shop By Category block was removed following the user's report
   that its category images were broken. Desktop category rendering is outside
   this removal.
7. The mobile and desktop homepage banners share `BannersFetch`. A direct
   mobile query failure currently prevents the desktop `Landing` from
   rendering.
8. Banner update deletes the old image before committing the database update;
   banner delete runs database and media deletion concurrently. Partial
   failure can therefore leave a live row with a missing image.

## Design contract

- Admins with existing `MANAGE_CONTENT` permission can list, create, edit,
  activate/deactivate, and delete mobile banners from a dedicated Mobile
  Banners area. Each banner retains title, description, image, and destination
  fields shared with desktop banners.
- Existing desktop banner records remain desktop records by default, and the
  desktop admin and homepage carousel continue to show only desktop banners.
- The migration adds a non-null mobile-placement field with a false default
  and transfers the six hardcoded mobile slide records into `home_banners`.
- The mobile carousel renders active mobile records from the database and
  uses each record's configured destination. Empty or unavailable data must
  not break the desktop carousel or leave an unusable mobile control.
- PNG/JPEG files up to 20 MiB can be selected. Files above 3.75 MiB are
  processed before upload; successful output is at most 3.75 MiB, and submit
  remains disabled while processing. A processing/format/size failure is
  visible and does not submit the original oversized image.
- PNG alpha is preserved. JPEG output remains JPEG. Files already within the
  output ceiling retain their bytes without unnecessary recompression.
- Mobile ReWear discovery includes a named, accessible navigation badge and a
  mobile-only card linking to `/rewear`. The card follows the supplied layout
  and uses the exact provided assets. Its text inherits the site's Nunito Sans
  font; no card-specific display font is introduced.
- The broken Shop By Category section is absent on mobile. Desktop category
  rendering is unchanged.
- Existing banner access controls, data/query ownership, unrelated commerce
  flows, ReWear request/authentication behavior, and homepage sections remain
  outside this change.
- The banner database row is authoritative. On update, commit the new row
  before deleting old media. On delete, remove the row and invalidate its
  cache before deleting media. If the database operation fails, retain the old
  referenced media. If post-commit media cleanup fails, keep the committed
  banner state and emit an error log that enables manual orphan cleanup; media
  cleanup failure must not restore or invalidate a live database reference.
- If image upload succeeds but banner create/update fails at the database
  write, attempt to delete the newly uploaded, unreferenced file. If this
  cleanup also fails, log a stable file key for manual orphan cleanup and
  preserve the original database error.
- If the mobile banner query fails, log the failure and continue rendering
  desktop banners from the existing desktop cache. Omit the mobile banner
  carousel for that request; do not render an empty or broken carousel.
- Database migration is deployed before application code that reads
  `is_mobile`.

## Decisions

- `DEC-285-001`: Use the existing `home_banners` table and add a boolean
  placement field with a desktop default. Class B, based on the existing
  banner model and issue's intent to extend the current desktop workflow.
- `DEC-285-002`: Use 3.75 MiB as the compression target, 20 MiB as the source
  selection limit, and PNG/JPEG as supported types. Class B, following the
  requested 4 MB upload ceiling and leaving byte margin for provider limits.
- `DEC-285-003`: Use the supplied ReWear screenshot/assets, link to `/rewear`,
  show the card only on mobile, and inherit global Nunito Sans. Class A,
  directly specified by the user.
- `DEC-285-004`: Remove the reported broken Shop By Category block from mobile
  and preserve the desktop section. Class A, directly specified by the user.
- `DEC-285-005`: Run the schema migration before deploying code that queries
  `is_mobile`. Class B, required by the migration/read dependency.
- `DEC-285-006`: Keep the banner database row authoritative and perform old
  media deletion only after database update/delete commits. Class B; this
  avoids broken live image references on partial provider/database failure,
  while a post-commit cleanup failure may leave an orphan for manual cleanup.
- `DEC-285-007`: On mobile banner query failure, log the error, continue with
  desktop banners, and omit the mobile carousel. Class B; the mobile query is
  an independent presentation path and should not take down desktop content.
- `DEC-285-008`: If create/update persistence fails after upload, attempt to
  remove the newly uploaded file; if cleanup fails, log its stable file key
  for manual cleanup and return the persistence failure. Class B; it limits
  abandoned uploads without obscuring the primary operation failure.

## Release and rollback

Run the repository Bun tests, targeted banner/ReWear tests, and governance
validation. Verify the migration against a representative existing database,
and inspect the home page at mobile and desktop widths. Confirm mobile and
desktop admin routes, CRUD/status operations, image processing around the
3.75 MiB boundary, PNG transparency, and configured destinations. Deploy the
migration before the application. Rollback application code before considering
any schema rollback; preserve migrated banner records unless an explicit data
rollback is approved. Exercise database and media deletion partial failures,
confirm create/update upload cleanup on database failure, confirm a mobile-query
failure leaves desktop banners available, and confirm manual cleanup is
actionable when post-commit file deletion fails.
