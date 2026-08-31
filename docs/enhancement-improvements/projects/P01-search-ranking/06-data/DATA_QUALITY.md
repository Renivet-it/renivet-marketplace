# Data Quality — P01

## Catalog-vs-search-index drift (REN-148's core concern)

**UNKNOWN, by design** — no mechanism exists to measure how stale the external search index is relative to the live Postgres catalog (CONFIRMED absence of any sync-status table, timestamp comparison, or reconciliation job in `src/`). This is precisely the gap REN-148 addresses, staged/cheap-step-only. Until that ships, there is no data-quality signal at all for this risk — it's a known unknown, not a measured one.

## Embedding data quality

`products.embeddings` etc. are written at product create/import time (CONFIRMED, `brands/products.ts`) but since they're never read, their accuracy/freshness is moot for current search behavior — flagging only because if REN-148 or any future work ever considers activating pgvector product-level search, the write-path's data quality (are embeddings regenerated on product edit, not just create?) would need separate investigation not done in this pass. **UNKNOWN** whether embeddings are refreshed on product update — not traced.

## Search analytics completeness

`searchAnalytics.resultCount` is schema-present but always null/unset today (see `06-data/DATA_REQUIREMENTS.md`) — a data-completeness gap that REN-154 closes going forward; it does not retroactively backfill historical rows (none exist with this data anyway).

## No customer-PII quality concerns

CONFIRMED — search-path tables carry only `sessionId`/`userId` references, no directly identifying fields beyond those FKs.
