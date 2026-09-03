# Data Requirements — P01

## Data already available (CONFIRMED)

| Data | Where | Used for |
|---|---|---|
| `brands.embeddings` (384-dim) | Postgres, ivfflat-indexed | Live brand fuzzy-match |
| `products.embeddings`, `semanticSearchEmbeddings`, `searchSuggestionEmbeddings` | Postgres, ivfflat-indexed | Written on product create/import; **not read** by any confirmed live query |
| `searchAnalytics` table | Postgres | Written by `logSearchQuery` today (query text, normalized query, intent type, matched IDs, session/user, result count field exists but is not populated — see below) |
| `searchIntents` table | Postgres | Keyword → category mapping, read by intent classifier |
| `brandAliases` table | Postgres | Alias lookup for brand intent detection |

## Data gap this Epic must close (REN-154)

`searchAnalytics` has a `resultCount` column (CONFIRMED in `logSearchQuery`'s insert shape) but nothing in the current call chain ever passes a non-`undefined` value for it — `logSearchQuery(result, sessionId, userId)` is called from `search.ts`'s `processSearch` mutation without a 4th `resultCount` argument. REN-154 needs to either (a) pass the eventual `getProducts()` result count into this same log row, which requires bridging Subsystem A and B's currently-separate call chains, or (b) log result count at the point `getProducts()` resolves, as a separate write. **DECISION REQUIRED**: which of these two shapes REN-154's implementation should take — this materially affects whether Subsystem A and B need a new integration point. Recommend (b) as lower-risk (avoids coupling the two subsystems further), but this is a real design choice for whoever picks up REN-154, not a rubber-stamp.

## Data needed for REN-158/151/155/159

None — all four are pure control-flow/predicate-construction changes over data already fetched. No new columns, no new tables, no data migration.

## Data needed for REN-148 (staged step only)

**UNKNOWN** — depends entirely on what "confirm/schedule sync cadence" ends up meaning operationally (a manual runbook item vs. an automated freshness check). Per the portfolio scope, this Epic does not commit to building a reconciliation data pipeline; see `07-feasibility/ALTERNATIVES.md`.

## No PII/financial data involved

CONFIRMED — none of `getProducts`, `search-engine.ts`, or the schema tables touched here (`searchAnalytics`, `searchIntents`, `brandAliases`, product/brand embeddings) contain payment, address, or identity data beyond an optional `userId`/`sessionId` foreign key on `searchAnalytics`. See `08-reliability/SECURITY.md`.
