# Admin Media Preview Performance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make existing product media, media-library thumbnails, and newly selected uploads appear quickly and consistently without loading full-size originals into every admin card.

**Architecture:** Product images remain public CDN assets while confidential agreement files remain private. Existing admin previews use optimized 320–480 px thumbnails through Next Image; newly selected files use local reduced previews immediately and continue uploading the original file. The media picker renders a small initial window, prefetches its list, and shows explicit loading/error states instead of blank cards.

**Tech Stack:** Next.js 15 App Router, React 19, UploadThing, Next Image/Sharp, tRPC, Bun tests.

**Spec:** `docs/superpowers/plans/2026-09-25-admin-media-preview-performance.md`

## Global Constraints

- Do not change the original customer-facing product image quality or replace original files.
- Do not make agreement or contract files public.
- Do not add a database migration or a second media table.
- Product-media upload routes must explicitly use `public-read`; confidential-document routes must explicitly use `private`.
- Local upload previews must render before the UploadThing request completes.
- Failed images must show a visible retry/error state; cards must never remain silently blank.

## Review Focus

- A private product image returns 401/403: migration reports it and the admin card shows a retry state.
- A newly selected 8 MB image: a reduced local preview appears before upload completion.
- A media library with thousands of records: only the first preview window requests thumbnails.
- A non-image media item: it renders the existing file icon and never enters image optimization.
- A proxy/CDN failure: the component performs one controlled fallback and then displays an error state without looping.

---

### Task 1: Prove the access and transfer-size root causes

**Files:**
- Create: `src/lib/media/admin-media-diagnostics.ts`
- Test: `src/lib/media/admin-media-diagnostics.test.ts`
- Modify: `src/app/api/admin/media/[id]/route.ts`

**Interfaces:**
- Produces: `classifyMediaResponse(status: number, contentType: string | null): "ok" | "unauthorized" | "missing" | "invalid-content" | "upstream-error"`.
- Produces: structured server logs containing media ID, status, content type, and content length only; never log URLs, keys, or payloads.

- [ ] **Step 1: Write failing classification tests**

```ts
expect(classifyMediaResponse(200, "image/webp")).toBe("ok");
expect(classifyMediaResponse(403, "application/json")).toBe("unauthorized");
expect(classifyMediaResponse(200, "text/html")).toBe("invalid-content");
```

- [ ] **Step 2: Run the focused test and confirm failure**

Run: `bun test src/lib/media/admin-media-diagnostics.test.ts`

- [ ] **Step 3: Implement classification and add safe route timing/size logs**

Record `lookupMs`, `upstreamMs`, `status`, `contentType`, and `contentLength`. Reject non-image responses instead of streaming HTML/JSON into an image element.

- [ ] **Step 4: Verify against one known failing product and one working product**

Expected evidence: whether the delay is authorization, original byte size, upstream latency, or invalid content. Do not begin Task 2 until this evidence is recorded in the PR description.

- [ ] **Step 5: Commit**

```bash
git add src/lib/media/admin-media-diagnostics.ts src/lib/media/admin-media-diagnostics.test.ts src/app/api/admin/media/[id]/route.ts
git commit -m "test: diagnose admin media preview failures"
```

### Task 2: Separate public product media from private documents

**Files:**
- Modify: `src/app/api/uploadthing/core.ts`
- Create: `src/lib/uploadthing/media-acl.ts`
- Test: `src/lib/uploadthing/media-acl.test.ts`
- Create: `scripts/media/migrate-product-media-acl.ts`
- Test: `scripts/media/migrate-product-media-acl.test.ts`

**Interfaces:**
- Produces: `PRODUCT_MEDIA_ACL = "public-read"` and `CONFIDENTIAL_MEDIA_ACL = "private"`.
- Produces: a dry-run-first migration that extracts UploadThing file keys from product-media URLs and calls `utApi.updateACL(keys, "public-read")` in batches of 25.

- [ ] **Step 1: Write tests proving route ACL separation**

Assert that `brandMediaUploader` uses `public-read` and confidential upload routes use `private`. Fail if either route inherits the app default.

- [ ] **Step 2: Configure UploadThing per-request ACL overrides**

The UploadThing dashboard must allow per-request ACL overrides. Keep the app default private, explicitly set brand/product image inputs to `acl: "public-read"`, and keep confidential documents at `acl: "private"`.

- [ ] **Step 3: Implement a dry-run migration for existing product media**

The script must print counts for eligible, malformed, already-public, updated, and failed files. It must require `--apply` before any ACL mutation and must not touch media referenced only by confidential records.

- [ ] **Step 4: Run dry-run in the target environment and review the exact count**

Run: `bun scripts/media/migrate-product-media-acl.ts`

Expected: no external mutation and a finite list of product-media file keys.

- [ ] **Step 5: Apply only after the dry-run count is approved**

Run: `bun scripts/media/migrate-product-media-acl.ts --apply`

- [ ] **Step 6: Commit**

```bash
git add src/app/api/uploadthing/core.ts src/lib/uploadthing/media-acl.ts src/lib/uploadthing/media-acl.test.ts scripts/media/migrate-product-media-acl.ts scripts/media/migrate-product-media-acl.test.ts
git commit -m "fix: separate product and confidential media access"
```

### Task 3: Deliver small thumbnails and immediate local previews

**Files:**
- Modify: `src/components/globals/media/product-media-preview.tsx`
- Test: `src/components/globals/media/product-media-preview.test.tsx`
- Create: `src/lib/media/create-local-image-preview.ts`
- Test: `src/lib/media/create-local-image-preview.test.ts`
- Modify: `src/components/globals/modals/brand/media-select.tsx`

**Interfaces:**
- Produces: `createLocalImagePreview(file: File, maxDimension?: number): Promise<{ url: string; revoke(): void }>` with a default maximum dimension of 480 px and WebP quality 0.72.
- `ProductMediaPreview` accepts `priority?: boolean`, `sizes: string`, and `onRetry?: () => void`.

- [ ] **Step 1: Write failing tests for source selection and local preview lifecycle**

Test that persisted images use optimized public URLs, `blob:` previews bypass all proxies, object URLs are revoked once, and a final failure renders a retry button.

- [ ] **Step 2: Implement reduced local previews**

Decode the selected file with `createImageBitmap`, resize it on a canvas to fit within 480×480 without upscaling, encode WebP at quality 0.72, and create an object URL from that thumbnail. Upload the untouched original `File`.

- [ ] **Step 3: Use Next Image for persisted thumbnails**

Use `fill`, `sizes="(min-width: 768px) 16vw, 50vw"`, and quality 70. Only the first product image is `priority`; remaining product images and all library thumbnails are lazy.

- [ ] **Step 4: Add visible states**

Render a neutral skeleton while decoding/loading. After one failed fallback, render “Preview unavailable” with a Retry button and retain the file name.

- [ ] **Step 5: Verify byte size**

For representative 4–8 MB originals, each card request must transfer an optimized image no larger than 480 px on its longest side and target no more than 120 KB. The local preview must appear within 250 ms on a normal desktop test machine.

- [ ] **Step 6: Commit**

```bash
git add src/components/globals/media/product-media-preview.tsx src/components/globals/media/product-media-preview.test.tsx src/lib/media/create-local-image-preview.ts src/lib/media/create-local-image-preview.test.ts src/components/globals/modals/brand/media-select.tsx
git commit -m "perf: optimize admin media thumbnails"
```

### Task 4: Reduce media-picker work and verify the complete flow

**Files:**
- Modify: `src/lib/product-media-selection.ts`
- Test: `src/lib/product-media-selection.test.ts`
- Modify: `src/components/globals/modals/brand/media-select.tsx`
- Modify: `src/components/globals/forms/product-manage.tsx`
- Create: `src/components/globals/media/admin-media-flow.test.tsx`

**Interfaces:**
- Change `MEDIA_PREVIEW_BATCH_SIZE` from 48 to 18.
- The picker fetches metadata once, renders 18 thumbnails initially, and adds 18 only when the scroll sentinel becomes visible.

- [ ] **Step 1: Write failing pagination and flow tests**

Cover: Edit Product first image eager; remaining images lazy; picker initial request count 18; next window loads at the sentinel; local upload preview appears before upload completion; selecting it keeps the preview visible in the product sequence.

- [ ] **Step 2: Prefetch media metadata before modal interaction**

Prefetch the tRPC media-list query when the Add Media control receives pointer focus/hover, while keeping product edit rendering independent from the full media library.

- [ ] **Step 3: Replace scroll arithmetic with an intersection sentinel**

Render only the current 18-item window and expand by 18 when the sentinel intersects. Reset to 18 when search changes.

- [ ] **Step 4: Run focused and full verification**

Run:

```bash
bun test src/lib/media src/lib/product-media-selection.test.ts src/components/globals/media
bun test
```

Acceptance checks:

- Existing selected media displays without blank cards.
- First selected product image appears within 1.5 seconds on a cold page load and 500 ms warm.
- Newly selected local image preview appears within 250 ms and before upload completion.
- Opening the picker initially requests no more than 18 thumbnails.
- No product-media request returns 401/403.
- Confidential agreement files remain inaccessible without authorization.

- [ ] **Step 5: Commit and request review**

```bash
git add src/lib/product-media-selection.ts src/lib/product-media-selection.test.ts src/components/globals/modals/brand/media-select.tsx src/components/globals/forms/product-manage.tsx src/components/globals/media/admin-media-flow.test.tsx
git commit -m "perf: bound admin media picker rendering"
```

## Self-Review

- Spec coverage: existing product images, modal library, new uploads, byte-size reduction, ACL separation, loading/error states, and end-to-end verification are covered.
- Placeholder scan: no deferred implementation steps remain.
- Type consistency: preview helper and component interfaces are defined before consumers.
- Review focus: each listed failure mode is assigned to a task-level test.
