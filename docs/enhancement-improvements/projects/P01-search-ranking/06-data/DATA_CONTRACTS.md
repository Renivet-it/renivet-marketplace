# Data Contracts — P01

## External RAG endpoint contract (CONFIRMED, as consumed)

`GET {base}/search/advanced-rag?query=<string>&limit=150` → expected: JSON array of objects each containing at least `id` (coerced to `String(d.id)`). Renivet's code defensively checks `Array.isArray(data)` before use; anything else is treated as zero results. **UNKNOWN**: any versioning, schema-stability, or breaking-change notification contract with the microservice owner/operator — no SLA or interface document found in the repo.

## External embeddings endpoint contract (CONFIRMED)

`POST {base}/embeddings/generate` (384-dim) and `/embeddings/generate-768` (768-dim) → expected `{ embedding: number[] }`, validated for exact length (384 or 768) before use; throws on mismatch. This is the one place with real response validation — CONFIRMED, `sematic-search.ts` lines 20-25 and 52-57.

## Internal contract: `getSearchRedirectUrl` output → navigation

`SearchResult` (from `search-engine.ts`) is the contract between Subsystem B and the UI. REN-149's fix depends entirely on this existing, already-well-typed contract (`IntentType`, `redirectUrl`-equivalent fields) being consumed correctly — no new contract needs to be defined, only wired up. Contract fields: `intentType`, `brandId/Slug/Name`, `categoryId/Slug`, `subcategoryId/Slug`, `productTypeId/Slug`, `normalizedQuery`, `originalQuery`, `confidence`. Note: the tRPC mutation response additionally spreads in `redirectUrl` and `uiCopy` (computed server-side in `search.ts`'s `processSearch` procedure, not part of the base `SearchResult` type) — REN-149's fix must consume `result.redirectUrl`, which exists only on the tRPC response shape, not on the base type from `search-engine.ts` directly.

## Internal contract: `getProducts()` return shape

`{ data: Product[], count: number, topBrandMatch: {...} | null }` — REN-155's fix changes what `count` means (must equal `data.length`'s true cross-page total under `requireMedia`) but must not change the shape itself, to avoid a breaking change for every caller (5 confirmed call sites).
