# Component Architecture — P01

CONFIRMED components, by responsibility.

| Component | File(s) | Responsibility | Live? |
|---|---|---|---|
| Catalog search/ranking | `src/lib/db/queries/product.ts` (`getProducts`) | Candidate generation (brand/RAG/ILIKE), filtering, ranking, pagination | Live |
| Ranking-order guard | `src/lib/db/queries/product-ordering.ts` | Suppress RAG relevance order when explicit sort chosen (SE-F002 fix) | Live |
| Embedding client | `src/lib/python/sematic-search.ts` | 384-dim / 768-dim embeddings, query preprocessing | Live (384-dim path); 768-dim path unconfirmed caller |
| Dead RAG client | `src/lib/python/ai-suggestion.ts` | Duplicate, unused RAG/suggestion client | Dead (REN-156 target) |
| Recommendation client | `src/lib/python/product-recommendation.ts` | Similar-products call, shared with P02 | Live |
| Intent classifier | `src/lib/search/search-engine.ts` | Deterministic brand/category/subcategory/product-type detection, redirect URL + copy generation, analytics logging | Live (`processSearch`, `logSearchQuery`, `getSearchRedirectUrl`, `getSearchCopy`); `getSuggestions` export is dead (REN-107, not P01) |
| Intent classifier API | `src/lib/trpc/routes/general/search.ts` | tRPC surface: `getSuggestions` (dead path), `processSearch` (live), `logSearchClick` (live but no-op stub, REN-154) | Mixed |
| Autosuggest API | `src/app/api/search/suggestions/route.ts` | REST proxy to external suggestions endpoint | Live |
| Search bar UI | `src/components/ui/product-search.tsx` | Input handling, calls autosuggest + `processSearch`, navigation on result (REN-149 bug site) | Live |
| Catalog listing UI | `src/components/shop/storefront-catalog-page.tsx`, `shop-products.tsx` | Calls `getProducts` with filters, defaults `requireMedia: true` | Live |
| Media hydration | `src/lib/redis/methods` (`mediaCache`) | Resolves media IDs to URLs for search results | Live |
| Schema | `src/lib/db/schema/product.ts`, `brand.ts`, `search.ts` | `products`/`brands` embeddings columns, `searchAnalytics`, `searchIntents` tables | Live (schema); product-embedding columns unread |

## Coupling notes

- Subsystem A and B (see `00-context/CURRENT_STATE.md`) share no code — they are coupled only at the UI layer (`product-search.tsx` calls both). A fix to one does not risk regressing the other, which lowers blast radius for every issue in this Epic except REN-149 (which is specifically about their integration point).
- `product-recommendation.ts` (P02-owned surface) shares the same external microservice host and the same "no timeout" defect class as P01's calls — REN-146 fixing the shared client pattern benefits both Epics, per `../../DEPENDENCY_GRAPH.md`'s shared-infrastructure edge. This Epic should not silently expand scope into P02's recommendation *logic*, only the shared timeout/config pattern if a shared utility is introduced (see `07-feasibility/BUILD_REUSE_BUY_SIMPLIFY.md`).
