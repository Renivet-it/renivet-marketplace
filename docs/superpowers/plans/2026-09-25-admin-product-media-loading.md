# Admin Product Media Loading Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make product media visible immediately and consistently on the Edit Product page, in the media picker, after upload, and in the selected sequence.

**Architecture:** Keep Postgres and the existing media/TRPC contracts unchanged. Use one small admin preview component for direct media rendering, keep the picker’s bounded lazy list for scalability, and separate optimistic local upload previews from the refreshed persisted media list so uploads never wait for the full library refresh before displaying.

**Tech Stack:** Next.js 15, React 19, TypeScript, tRPC, UploadThing media URLs, Bun tests.

**Spec:** User-provided requirements in the current conversation.

## Global Constraints

- Existing saved product media must be visible when Edit Product opens.
- The Edit Product page must not wait for the complete brand media library to render the product’s selected media.
- Opening the plus button must show media-library thumbnails, not blank cards.
- New uploads must show local previews immediately while the upload is in progress.
- Persisted uploaded media must replace temporary previews without duplicate cards.
- Selected media must remain visible in the selected sequence with its thumbnail.
- Preserve the existing product media order, remove, move, upload, and save behavior.
- Do not add migrations, new storage providers, new environment variables, or unrelated refactoring.

## Review Focus

- A saved product with one inaccessible/expired image URL must not prevent the other selected images from rendering; test individual image failure isolation.
- A brand with thousands of media records must not block the initial selected-product preview; test that the initial render uses product media independently of the library query.
- An upload still in progress must show its local object URL before the server response; test the optimistic preview path.
- A successful upload must replace its temporary object URL with the persisted media item exactly once; test deduplication and object-URL cleanup.
- Opening and closing the picker repeatedly must not lose selected sequence state; test selection state across modal lifecycle.

### Task 1: Establish the media-loading contract and regression tests

**Files:**
- Modify: `src/components/globals/media/product-media-preview.tsx`
- Test: `src/components/globals/media/product-media-preview.test.tsx`
- Test: `src/lib/product-media-selection.test.ts`
- Test: `src/components/globals/modals/brand/media-select.test.tsx` if component-level modal coverage is supported by the existing test setup

**Interfaces:**
- Consumes: `BrandMediaItem.url`, `BrandMediaItem.alt`, `BrandMediaItem.name`, and `BrandMediaItem.type`.
- Produces: a shared admin preview contract that renders a direct source URL and exposes stable behavior for image, video, and non-previewable media types.

- [ ] **Step 1: Write failing tests**

  Add tests that assert the preview output uses the exact media URL, `loading="eager"`, and no `/_next/image` proxy URL. Add a media-selection test that preserves the selected item’s direct URL when an optimistic item is merged with persisted results.

- [ ] **Step 2: Run the focused tests and confirm the expected failures**

  Run:

  ```powershell
  bun test src/components/globals/media/product-media-preview.test.tsx src/lib/product-media-selection.test.ts
  ```

  Expected: the new direct-render and optimistic-merge assertions fail against the current implementation.

- [ ] **Step 3: Implement the smallest shared preview contract**

  Keep the preview URL direct. Render image media with a native eager image element, render video media with a bounded metadata preview, and retain the existing file icon behavior for non-image/non-video media. Do not route admin media through the Next image optimizer.

- [ ] **Step 4: Run the focused tests again**

  Run the command above and require all tests to pass.

- [ ] **Step 5: Commit the contract and tests**

  ```powershell
  git add src/components/globals/media/product-media-preview.tsx src/components/globals/media/product-media-preview.test.tsx src/lib/product-media-selection.test.ts
  git commit -m "test: define admin media preview loading contract"
  ```

### Task 2: Make selected product media instant on Edit Product open

**Files:**
- Modify: `src/app/(protected)/dashboard/general/products/preview-form/[id]/page.tsx`
- Modify: `src/components/globals/forms/product-manage.tsx`
- Modify: `src/components/dashboard/general/products/admin-product-edit-tabs.tsx` only if tab mounting currently prevents the edit form from being ready by default
- Test: `src/components/globals/forms/product-manage.test.tsx` or a focused data-flow test beside the existing form tests

**Interfaces:**
- Consumes: `product.media` and its resolved `mediaItem` records already returned by `productQueries.getProduct`.
- Produces: `ProductManageForm` receives selected product media immediately; the full brand media library remains an asynchronous picker dependency.

- [ ] **Step 1: Write a failing initial-render test**

  Assert that the selected media used by the Edit Product form is derived from `product.media` and does not require the full `allMedia` library query to resolve.

- [ ] **Step 2: Run the test and confirm it fails**

  Run the focused form/data-flow test and confirm the failure reproduces the current dependency on the large library payload or optimizer-rendered media.

- [ ] **Step 3: Implement immediate selected-media rendering**

  Keep `selectedMedia` initialized from the product’s persisted media. Use the shared preview component for the product cards. If the server page currently fetches the complete brand library before returning the form, move that library load out of the critical product-edit render path and leave it for the picker query; pass only the product’s selected media as initial form data.

- [ ] **Step 4: Verify selected media does not disappear during library loading**

  Run the focused test and confirm selected cards render from product data while the library request is pending.

- [ ] **Step 5: Commit the Edit Product loading path**

  ```powershell
  git add "src/app/(protected)/dashboard/general/products/preview-form/[id]/page.tsx" src/components/globals/forms/product-manage.tsx src/components/dashboard/general/products/admin-product-edit-tabs.tsx
  git commit -m "fix: render selected product media immediately"
  ```

### Task 3: Make the media picker library thumbnails reliable and bounded

**Files:**
- Modify: `src/components/globals/modals/brand/media-select.tsx`
- Modify: `src/components/globals/modals/brand/product-media-select-single.tsx`
- Modify: `src/components/globals/forms/product-manage.tsx` only for picker query enablement or initial data wiring
- Test: `src/components/globals/modals/brand/product-media-select-single.test.tsx` or the nearest existing media-picker test file

**Interfaces:**
- Consumes: paged/bounded `visibleMedia`, the existing search input, and the existing `getMediaItems` TRPC result.
- Produces: visible library thumbnails for the first batch and additional batches as the internal picker scrolls, without loading every thumbnail at once.

- [ ] **Step 1: Write failing thumbnail and bounded-list tests**

  Assert that an image card emits the direct media URL and eager preview attributes, that non-image media keeps its file fallback, and that the visible list still stops at the configured preview batch size until the picker scrolls.

- [ ] **Step 2: Run focused picker tests and confirm failures**

  Run the picker test file and confirm the old optimizer/lazy path fails the direct-thumbnail contract.

- [ ] **Step 3: Implement shared direct rendering without removing bounded loading**

  Replace only the thumbnail renderer with the shared preview component. Keep the existing `MEDIA_PREVIEW_BATCH_SIZE`, internal scroll container, search filtering, and selection handlers unchanged.

- [ ] **Step 4: Verify the first batch, scroll batch, and non-image fallback**

  Run focused picker tests and confirm all three behaviors.

- [ ] **Step 5: Commit the picker change**

  ```powershell
  git add src/components/globals/modals/brand/media-select.tsx src/components/globals/modals/brand/product-media-select-single.tsx src/components/globals/modals/brand/product-media-select-single.test.tsx
  git commit -m "fix: render media picker thumbnails reliably"
  ```

### Task 4: Make upload and selected-sequence previews immediate and deduplicated

**Files:**
- Modify: `src/components/globals/modals/brand/media-select.tsx`
- Modify: `src/lib/product-media-selection.ts`
- Test: `src/lib/product-media-selection.test.ts`
- Test: `src/lib/uploadthing/batch-upload.test.ts` if upload callback behavior changes

**Interfaces:**
- Consumes: the existing `URL.createObjectURL` upload preview records and the upload success/error callbacks.
- Produces: temporary previews immediately, persisted records after upload, no duplicate media cards, and selected sequence thumbnails that remain visible after selection.

- [ ] **Step 1: Write failing upload lifecycle tests**

  Cover these exact transitions:

  ```text
  file selected -> temporary preview visible
  upload succeeds -> temporary record replaced by persisted record
  upload fails -> temporary record removed and object URL revoked
  persisted record already exists -> no duplicate temporary/persisted card
  selected record -> selected sequence keeps its direct thumbnail URL
  ```

- [ ] **Step 2: Run the tests and confirm the lifecycle failures**

  Run:

  ```powershell
  bun test src/lib/product-media-selection.test.ts src/lib/uploadthing/batch-upload.test.ts
  ```

- [ ] **Step 3: Implement the minimal merge and cleanup logic**

  Keep optimistic records in local state, merge refreshed server data by media ID, revoke only object URLs owned by temporary records, and preserve selected order when persisted records arrive.

- [ ] **Step 4: Run the upload and selection tests again**

  Require all lifecycle assertions to pass.

- [ ] **Step 5: Commit the upload lifecycle change**

  ```powershell
  git add src/components/globals/modals/brand/media-select.tsx src/lib/product-media-selection.ts src/lib/product-media-selection.test.ts src/lib/uploadthing/batch-upload.test.ts
  git commit -m "fix: keep upload and selected media previews immediate"
  ```

### Task 5: End-to-end verification and handoff

**Files:**
- No application files unless a test exposes a defect in Tasks 1–4.

- [ ] **Step 1: Run formatting and diff checks**

  ```powershell
  bunx prettier --check src/components/globals/media src/components/globals/forms/product-manage.tsx src/components/globals/modals/brand/media-select.tsx src/components/globals/modals/brand/product-media-select-single.tsx src/lib/product-media-selection.ts
  git diff --check
  ```

- [ ] **Step 2: Run the focused media suite**

  ```powershell
  bun test src/components/globals/media/product-media-preview.test.tsx src/lib/product-media-selection.test.ts src/lib/uploadthing/batch-upload.test.ts
  ```

- [ ] **Step 3: Run the full required test suite**

  ```powershell
  bun test
  ```

  Record unrelated pre-existing failures separately; do not claim a clean suite unless the command exits successfully.

- [ ] **Step 4: Verify in the browser**

  On `/dashboard/general/products/preview-form/<productId>`:

  1. Open the page and confirm every saved product image is visible before opening the picker.
  2. Click `+`; confirm the first thumbnail batch is visible immediately.
  3. Scroll the picker; confirm newly revealed batches show thumbnails.
  4. Upload one image; confirm its local preview appears before upload completion.
  5. Select it; confirm it appears in selected sequence with its thumbnail.
  6. Close and reopen the picker; confirm selected order and thumbnails remain.
  7. Refresh the page; confirm persisted images remain visible.

- [ ] **Step 5: Push and open the PR only after verification**

  ```powershell
  git push -u origin fix/admin-product-media-loading
  ```

  Open the PR against `master`, include the exact test counts, and explicitly report any unrelated full-suite failure.

## Self-Review Checklist

- The selected product preview is independent of the full media-library load.
- The picker remains bounded and does not render the entire brand library at once.
- Direct media URLs are used consistently in product cards, picker cards, upload previews, and selected sequence previews.
- Temporary object URLs are revoked on both success and failure.
- Selection order and existing remove/move/save behavior are unchanged.
- No database schema, migration, storage provider, or environment-variable changes are introduced.
