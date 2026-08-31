# Data Quality — P02

## Confirmed data-quality dependencies affecting recommendation output today

- **Category/brand/product-type completeness** (owned by P08): Placement C's order-based and browsing-history branches rank by category/brand/product-type match; a product with a missing or miscategorized `categoryId` will simply never match, silently reducing personalization quality with no error surfaced. **INFERRED impact** — not measured in this pass, but structurally certain given how the `WHERE`/`ORDER BY` clauses key off these fields.
- **`semantic_search_embeddings` population** (Placement A's fallback branch only): **UNKNOWN** how comprehensively this pgvector column is populated across the catalog. If a meaningful fraction of products lack an embedding, the fallback query's `WHERE p.semantic_search_embeddings IS NOT NULL` filter (`cart.ts:854`) silently shrinks the fallback's effective candidate pool — worth a data-quality check before or alongside FR-1's fix, though not a blocker to shipping FR-1 (the new independent-DB fallback tier proposed in FR-1 does not depend on this column at all, which somewhat de-risks this unknown).
- **Media completeness:** all three placements filter or expect `hasMedia`/media hydration; a product without hydratable media will not visually render well in a recommendation card even if it's a valid recommendation — existing filters (`hasMedia(products, "media")` in `recommendation.ts`) already guard against this for Placement C; Placements A/B do not appear to explicitly require media presence before including a product (confirmed: no `hasMedia` filter in `cart.ts`'s hydration query or in `getAdvancedRecommendations`'s consumption) — a card could render with `imageUrl: null` (handled gracefully by a `ShoppingBag` icon placeholder in `wardrobe-suggestions.tsx:154-156`, so this is a UX degradation, not a break).

## Data-quality risks introduced by V1 fixes themselves

- **FR-4 caching + availability drift:** a cached recommendation could reference a product that goes out of stock or is deactivated within the cache TTL window. Mitigated by BR-1 (re-validate or short TTL) — this is a new, self-inflicted data-quality risk that V1 must explicitly handle, not a pre-existing one. See `03-requirements/BUSINESS_RULES.md` BR-1 and `08-reliability/FAILURE_MATRIX.md`.
- **FR-1's new fallback tier** reuses existing, already-filtered `getProducts`-style queries (availability/publication gates already enforced) — no new data-quality risk introduced.

## Out of scope

Deeper data-quality remediation (e.g., auditing category-tagging accuracy across the catalog) belongs to P08, not this Epic — named here only where it directly bears on recommendation output quality, per the orchestrator's evidence-based-only instruction.
