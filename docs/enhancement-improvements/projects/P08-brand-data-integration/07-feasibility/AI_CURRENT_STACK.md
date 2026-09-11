# AI Current Stack — Verified 2026-08-30

Every claim below is verified against current source and/or a live test call made during this pass — not restated from a prior report without re-checking. Where this corrects an earlier document, the correction is called out explicitly.

## Embedding columns (verified against `src/lib/db/schema/product.ts`, `brand.ts`)

| Column | Dimension | Index | Read or write-only? |
|---|---|---|---|
| `products.embeddings` | 384 | ivfflat/cosine | **Read live** — `getAllCatalogueProducts` (relevance-threshold filtering) |
| `products.searchSuggestionEmbeddings` | 384 | ivfflat/cosine | **Write-only, confirmed no read anywhere** |
| `products.semanticSearchEmbeddings` | 768 | ivfflat/cosine | **Read live** — `cart.ts` similar-products recommendation fallback |
| `brands.embeddings` | 384 | none | **Read live** — main product search, brand-intent detection |

## Model and service, verified directly from `src/lib/python/sematic-search.ts`

- **384-dim model:** code comment identifies it as "MiniLM model (legacy)."
- **768-dim model:** code comment identifies it as "E5-base-v2 model."
- **Endpoints, confirmed exact paths from source:** `POST /embeddings/generate` (384-dim), `POST /embeddings/generate-768` (768-dim), plus a separate `GET /search/advanced-rag` endpoint used directly by product search.
- **Host:** hardcoded literal string `http://64.227.137.174:8000` — no environment-variable override in effect (a dead `EMBEDDING_SERVICE_URL` read exists but is unused).
- **Authentication:** none — `Content-Type: application/json` is the only header sent.
- **Request/response format, confirmed by live test call this pass:** `POST {text: string}` → `{embedding: number[]}`.

## Live behavior, measured this pass (not assumed)

Real test calls made to both endpoints during this benchmark (`Available Qty`, plain JSON POST, no auth):

| Endpoint | HTTP status | Single-call latency observed | Mean latency across ~17 calls in the benchmark run |
|---|---|---|---|
| `/embeddings/generate` (384) | 200 | 110–120ms | 103–118ms |
| `/embeddings/generate-768` | 200 | 235ms | 238–256ms |

Service is live, responsive, unauthenticated, and reachable from outside Renivet's own infrastructure at the time of this test — consistent with the prior finding that it has no visible access control.

## Generation code

`generate-embeddings.ts` and `generateBrandEmbeddings.ts` (repo root) — standalone manual/cron scripts. Equivalent generation also runs inline inside tRPC product create/update/bulk-import procedures.

## Cost, hosting, deployment topology

**UNKNOWN, not $0.** This is a self-hosted VPS at a bare IP — no billing/metering information exists in-repo. Deployment topology (single instance, no load balancer/HA evidence, no health-check endpoint found) suggests a single point of failure, consistent with REN-146's finding that it has no timeout protection on the caller side either.

## Correction to the prior portfolio record

Earlier documents (including P01's own SRS `06-data/DATA_REQUIREMENTS.md`) stated `products.*embeddings` columns were "written but never read." **This is only true for `searchSuggestionEmbeddings`.** `products.embeddings` and `products.semanticSearchEmbeddings` are both read live, as documented above. Any future reuse of these columns for P08 purposes should account for the fact that they already have live production consumers (P01/P02's search and recommendation paths) — a new P08 consumer would be a third and fourth read path on infrastructure already flagged as fragile and currently being hardened (REN-146).
