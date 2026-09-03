# Non-Functional Requirements — P01

| ID | Category | Requirement | Current state | Source issue |
|---|---|---|---|---|
| NFR-1 | Reliability | External ML/search calls must not block indefinitely; must degrade to an existing fallback within a bounded time. | No timeout exists (CONFIRMED) | REN-146 |
| NFR-2 | Performance | Search request latency should not include avoidable sequential round-trips for independent external calls. | One confirmed avoidable sequential pair (REN-151) | REN-151 |
| NFR-3 | Performance | Category-listing requests (no free-text search) should avoid redundant DB work on repeat requests within a short window. | No caching layer (CONFIRMED absence) | REN-159 |
| NFR-4 | Performance | The DB query for search should not evaluate unindexed text predicates when an authoritative candidate set already exists. | Always evaluated today (CONFIRMED) | REN-158 |
| NFR-5 | Observability | Search must be measurable (click-through, result counts) to support any future quality work. | No-op stub (CONFIRMED) | REN-154 |
| NFR-6 | Correctness | Pagination/result counts shown to a customer must reflect the actual filtered result set. | Mismatch possible (CONFIRMED) | REN-155 |
| NFR-7 | Maintainability | No dead code paths that duplicate a live external-call path should remain in the search module. | One confirmed dead duplicate (CONFIRMED) | REN-156 |
| NFR-8 | Data freshness | The external search index should not silently diverge from the live catalog beyond an agreed, monitored bound. | No monitoring exists (CONFIRMED absence) | REN-148 |
| NFR-9 | Security | External calls must use TLS, not a bare HTTP IP literal. | Currently plain HTTP to an IP literal (CONFIRMED) | Rolled into REN-146's endpoint-configuration fix |

## Numeric targets

**UNKNOWN for all of the above** — no latency SLA, cache-hit-rate target, or timeout-duration value exists in any document. See `08-reliability/PERFORMANCE.md` for what would need instrumentation (REN-154) before any number can be set responsibly. Recommend the timeout value (NFR-1) be picked conservatively (e.g. in the low single-digit seconds) and tuned once REN-154 produces real latency data — this is a DECISION REQUIRED item for whoever implements REN-146.
