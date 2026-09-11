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
