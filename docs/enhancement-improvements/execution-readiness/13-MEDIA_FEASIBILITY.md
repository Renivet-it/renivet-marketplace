# Gate 23 — Media Architecture Re-Validation

Verified directly against current schema/code, 2026-08-30.

## Current architecture, confirmed

- **Table:** `brandMediaItems` (`brand-media-item.ts`) — columns `id`, `brandId`, `url`, `type`, `name`, `alt`, `size`.
- **Association:** `products.media` (`product.ts:42`, `jsonb`) stores `{id: uuid → brandMediaItems.id, position}` per `productMediaSchema` (`validations/product.ts:102-116`), hydrated at read time via `enhancedProductMediaSchema`, backed by a Redis `mediaCache`.
- **The known bypass:** `productVariants.image` (`product.ts:493`) is a bare `text("image")` column — no foreign key, confirmed still a raw-URL bypass of the `brandMediaItems` pattern, unchanged from the original research finding.
- **Storage provider:** UploadThing (`src/app/api/uploadthing/core.ts`, `route.ts`).

## Verdict

**Reusing `brandMediaItems` for P08's File-First media ingestion is a pure extension — no schema change needed for the pattern itself.** The only open design question is whether to eventually migrate `productVariants.image` onto the same pattern — P08's own documentation already correctly scopes this as out of scope for V1, and this gate confirms that's still the right call (fixing an unrelated pre-existing bypass is not a P08 V1 dependency).

## Explicit confirmation per the source prompt's instruction

**Images are not being moved into Redis** — Redis's role here is a read-time cache for already-uploaded media metadata (`mediaCache`), not a storage tier. UploadThing remains the actual storage provider, unchanged, and P08's V1 should write through the same UploadThing + `brandMediaItems` path new product-media uploads already use.
