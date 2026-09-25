# REN-230 — Legacy Product Slug Migration, Redirects & Historical URL Safety

## Goal

Provide an administrator-controlled, repeatable migration for eligible legacy product slugs while preserving every migrated URL through permanent redirects and a queryable slug history.

## Repository findings

- `generateProductSlug()` and `generateProductSlugCandidate()` already provide the shipped JavaScript slug behavior and must be reused.
- `products.slug` is required and unique; product relations use stable product IDs, not slugs.
- The public product route currently looks up the current slug and calls `notFound()` on a miss. It has no historical-slug fallback.
- The visible-product gate is `isPublished && isAvailable && isActive && !isDeleted && verificationStatus = approved` plus an active brand.
- The admin area already has finance/compliance maintenance pages and an `adminProcedure` for administrator-only mutations.
- The audit identified 2,003 timestamp-bearing legacy rows, 1,524 currently public rows, 50 collision groups, 16 public-vs-public groups, and 28 Unicode-sensitive rows. These counts must be reported by the preview, not hard-coded as assumptions.

## Scope and design

1. Add a product slug history table keyed by `(product_id, old_slug)` with current redirect target, migration timestamp, and a uniqueness constraint on `old_slug`.
2. Resolve an unmatched public product URL through slug history and issue a permanent redirect to the product's current slug. Keep current-slug lookup and canonical/sitemap behavior unchanged.
3. Add an administrator-only Settings maintenance workspace with a preview action and an explicit apply action. The UI must show eligible count, skipped non-public count, collision/conflict count, Unicode-sensitive count, and a sample mapping before apply.
4. Generate every proposed mapping with the real `generateProductSlug()` implementation and deterministic suffix allocation in `createdAt ASC, id ASC` order. Never use a SQL approximation.
5. Migrate only products that are public at execution time and whose proposed slug can be assigned without ambiguity. Collision groups must remain visible as conflicts until the preview can prove a unique mapping; no product may silently overwrite another slug.
6. Write old-slug history and the new product slug in the same transaction per batch. Preserve the old slug before changing it so rollback can restore the exact prior value.
7. Make repeated preview/apply safe: already-clean slugs are unchanged, already-migrated old slugs are not duplicated, and a product whose current slug no longer matches the preview is skipped and reported for a new preview.
8. Extend historical landing-path analytics resolution through the slug-history table so pre-migration reports retain product enrichment.
9. Add structured audit evidence for preview/apply counts and actor identity. Do not expose product payloads beyond the mapping/report fields required by the UI.

## Explicit non-goals

- Do not change the existing slug generator or new-product slug behavior.
- Do not migrate soft-deleted, inactive, unavailable, unpublished, unapproved, or inactive-brand products.
- Do not change commission, pricing, catalog ordering, media, or unrelated URL systems.
- Do not create a general-purpose alias table for categories, brands, or blogs.
- Do not deploy or execute against production as part of development verification.

## Operator flow

`Admin Settings -> Legacy Product Slugs -> Preview migration -> inspect report/conflicts -> Apply eligible mappings -> batch progress and final report`.

The apply action is disabled when the preview has unresolved conflicts or when the source data has changed since preview. A fresh preview is required after a conflict or stale-preview response.

## Rollback

The history table is the rollback source. A rollback utility is not exposed in the initial Settings UI, but the persisted `(product_id, old_slug, new_slug)` records and transaction boundaries must make a reviewed rollback script possible without guessing from titles.

## Safety contract

- A legacy slug is eligible when it matches the existing timestamp-bearing format identified by the audit: a final `-<13-digit-millisecond-epoch>-<base36 token>` segment. The exact JavaScript predicate is shared by preview and apply; clean slugs are not rewritten.
- The deployment order is: migration tables/indexes first, redirect/history resolver second, analytics history resolver third, admin preview/apply UI and mutation last. No product slug write is permitted before the first three are deployed.
- History stores `productId`, `oldSlug`, `newSlug`, `migratedAt`, `runId`, `batchId`, and actor metadata. `oldSlug` is unique; `productId`, `runId`, and `batchId` are indexed; the product foreign key uses restrictive behavior for history retention.
- A migration run stores an immutable manifest hash, preview timestamp/expiry, actor, eligibility scope, status, batch checkpoints, counts, conflicts, and errors. Apply requires the same manifest hash, an unexpired preview, and current `updatedAt`/slug values for every row in the batch.
- Batch work locks the selected product rows (`FOR UPDATE` equivalent in the database layer), reserves all existing and in-run candidate slugs, and skips any current-slug/history collision rather than overwriting it. A concurrent apply cannot consume the same manifest twice.
- Public collision groups remain in `manual_review` and cannot be applied until an administrator approves each group in the preview. The approved order is `createdAt ASC`, then product ID ASC.
- Historical URL redirects use HTTP 308 (permanent redirect) with the original query string preserved. Unknown slugs continue to return `notFound`; metadata generation uses the same historical resolver and canonicalizes to the current slug.
- After each batch, the operator receives counts and a sampled old-URL redirect check before the next batch. A failed batch is recorded and resumable; it is never reported as fully applied.
- Audit records include run ID, batch ID, actor ID, start/end time, status, eligible/applied/skipped/conflict/error counts, and manifest hash. No titles, payloads, or private data are needed in the audit event.

## Required test evidence

- Exact JavaScript mapping, Unicode handling, deterministic collision suffixing, and public eligibility.
- Transactional history + product update behavior and stale-preview/idempotency guards.
- Permanent redirect from an old slug and no redirect for unknown slugs.
- Analytics historical-path resolution through the history table.
- Admin authorization and Settings preview/apply UI state for conflicts, progress, and errors.
