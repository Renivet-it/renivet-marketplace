# Audit → Epic Traceability — P01

Restates the relevant rows of `../../AUDIT_TO_BACKLOG_TRACEABILITY.md` (Source 1, ecommerce-intelligence audit) filtered to EPIC-P01-001, for standalone readability of this package. Not a re-derivation — that document remains the source of truth; see it directly for the other Epics' rows.

| Audit finding ID | Domain | QC disposition | Linear issue | Status |
|---|---|---|---|---|
| M-01/M-02 | External ML dependency (bundled) | KEEP, bundled | REN-146 | Backlog, P1 |
| M-03 | External search index drift | KEEP, staged | REN-148 | Backlog, P1 — full migration out of scope |
| SE-F009 | Search typo tolerance | DEFERRED — gated on REN-146 data | REN-167 | Deferred |
| SE-F003 | Search intent redirect | KEEP, one-line fix | REN-149 | Backlog, P1 |
| SE-F002 | Sort-by-price override | RESOLVED pre-audit (commit `8b302953`) | No ticket needed | Resolved — recommend regression test only |
| SE-F004 | requireMedia post-pagination | KEEP | REN-155 | Backlog, P2 |
| SE-F006 | Dead code / redundant RAG calls | KEEP | REN-156 | Backlog, P2 |
| SE-F008 | Unused `getSuggestions` generator | Bundled | REN-107 (XC-DEBT-001, **not P01**) | Backlog, P3 — noted for context only |
| PF-F001 | Sequential external calls in `getProducts()` | KEEP, confirmed non-overlap w/ REN-83 | REN-151 | Backlog, P1 |
| PF-F004 | ILIKE fallback runs redundantly | KEEP | REN-158 | Backlog, P2 |
| PF-F005 | Catalog listings never cached | KEEP, confirmed non-overlap w/ REN-139/140 | REN-159 | Backlog, P2 |
| AN-F002 | Search click/result-count logging is a no-op stub | KEEP | REN-154 | Backlog, P1 |

**REN-83** ("Optimise Product Search Performance and Reduce Result Display Delay") predates and is separate from the audit findings above — it is the one Done issue in this Epic, confirmed shipped as the `Promise.all([findMany, count])` parallelization in `getProducts()`.
