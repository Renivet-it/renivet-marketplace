# Observability — P01

## Current state: minimal (CONFIRMED)

All existing "observability" is `console.log`/`console.error`/`console.warn` calls scattered through `getProducts()` and the external-service clients — CONFIRMED, no structured logging, no metrics emission, no tracing, no dashboards found anywhere in `src/` for search specifically.

| Dimension | Current state | What would close the gap |
|---|---|---|
| Success rate | Not tracked | Would fall out of REN-154's logging once result counts are recorded (zero-result vs. non-zero-result rate) |
| Failure rate | Not tracked (only console-level, per-request) | Structured logging of which branch (RAG/ILIKE/brand-exact) served each request — recommended addition alongside REN-154, see `05-algorithms/DECISION_LOGIC.md` |
| Latency | Not tracked | See `08-reliability/PERFORMANCE.md` — needs new timing instrumentation, natural companion to REN-146 |
| Retries | N/A — no retry logic exists today (CONFIRMED; failures go straight to fallback, not retried) | Not needed unless REN-146's timeout design introduces retries, which is not currently proposed |
| Business outcome (search → purchase conversion) | Not tracked | Would need `searchAnalytics` rows linked to order events — cross-Epic with P06, likely beyond REN-154's literal scope; flag as a future V2-shaped need, not this Epic's job to build |
| Infrastructure cost | Not tracked | UNKNOWN what the external microservice costs Renivet per call or per month; no cost dashboard referenced anywhere |
| Anomaly detection | None | Not proposable responsibly until baseline metrics (above) exist |

## REN-154 as the load-bearing prerequisite

Every row in the table above that says "would fall out of REN-154" is not incidental — the incoming evidence summary's framing of REN-154 as "a prerequisite for measuring search quality at all" is CONFIRMED accurate by this pass's reading of the code: there is currently no data path from a search request to any durable, aggregatable signal about how well it performed.

## Recommendation for this Epic's scope

Ship REN-154 with the minimum viable schema (click event + result count) rather than a full observability platform. Do not build dashboards, alerting, or anomaly detection as part of this Epic — no baseline exists yet to alert against, and building alerting infrastructure before there's a metric to alert on is the overengineering failure mode this program's `PORTFOLIO_ANTI_OVERENGINEERING.md` warns against. Revisit once REN-154's data has accumulated for a meaningful window (**DECISION REQUIRED**: how long is "meaningful" — not decidable from this pass).
