# Search embedding sync

REN-148 adds `GET /api/cron/search-embedding-sync` as the staged catalog
coverage job. It does not replace the external RAG search path.

## Scheduler configuration

- Cadence: once daily at 02:00 Asia/Kolkata.
- Request timeout: 10 minutes.
- Request: `GET https://<production-host>/api/cron/search-embedding-sync`.
- Authentication: `Authorization: Bearer $CRON_SECRET`.
- Retry: allow the next scheduled run to retry failed products; do not run
  concurrent invocations.
- The endpoint returns `alreadyRunning: true` when the database advisory lock
  is held by another run.

Each run processes at most 25 products in deterministic ID order. It reports
per-product `processed`, `updated`, `skipped`, `failed`, and
`partiallyUpdated` counters. Embedding vectors and provider error payloads are
never returned.

Deployment operators must register the URL and secret in the existing external
cron service. No scheduler credentials belong in the repository.

## Search behavior while catalog coverage is incomplete

Product search combines local keyword matches (including taxonomy and metadata)
with RAG candidates. Missing embeddings must not exclude products that match
locally. Brand-only searches use the brand ID so their result count agrees with
the same brand filter. The header preview uses this catalog query too.

RAG requests have a 5-second deadline. If they fail or return no usable product
UUIDs, search tries local 768-dimensional vectors with a 4-second embedding
deadline, then continues with keywords. Local vector candidates are filtered
for catalog eligibility before ranking by cosine distance. The local fallback
uses exact distance ordering to avoid an approximate index returning too few
candidates on the current catalog.

Cosine distance is a ranking signal, not a universal relevance cutoff. Do not
treat the upstream RAG `match.score` as cosine similarity: it is a separate
ranking score. The former 0.28 semantic brand threshold is no longer used for
product search; brand identification uses names instead. A new cutoff needs
query/product relevance evaluation against the actual model and catalog.

If only semantic candidates match, the catalog labels them as similar products.
If no candidates or keywords match, it shows discovery products within the
shopper's selected filters and labels that fallback. It retains publication,
availability, brand visibility and media requirements. Impossible filter
combinations still offer a reset rather than misrepresenting unavailable items.
