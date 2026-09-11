# REN-190 Critique

## Initial independent review

The first independent review found three design blockers:

1. The scope must be server-derived, not a browser-provided product-ID list.
2. Every filter metadata query must apply the same scope, not just product results.
3. Default curator ordering needs explicit semantics and a stable tie-breaker.

The specification was revised to use a literal `catalogContext: "festive"`, resolve selection only on the server, enumerate every scoped query path, disable recommendations for this context, require scope containment for RAG search, and define ordering and invalidation behavior.

## Fresh independent re-review

The second independent review required an executable cache and ordering contract, complete traceability, and valid governance fields. Those requirements are resolved in the approved work item:

- Context is part of every SSR, filter-cache, tRPC/React Query, and prefetch key; festive bypasses global catalogue caches.
- The server derives ordered curated IDs, applies an always-false predicate for an empty selection, and defines exact default and user-sort ordering.
- Admin updates invalidate `/festive`.
- The work item includes bidirectional scenario, invariant, and test mappings.
