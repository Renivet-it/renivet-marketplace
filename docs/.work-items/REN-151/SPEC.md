# REN-151 — Parallelize independent external calls in the catalog search path

## Decision

Status: `IN_REVIEW`; implementation is not authorized until the owner approves this contract.

Risk: `L2`. This is a single read-only catalog method, but it changes concurrency and failure timing around an external search integration.

## Evidence and scope

`src/lib/db/queries/product.ts:getProducts()` currently handles non-exact-brand search by awaiting the embedding/brand-match sequence and then awaiting the Advanced RAG HTTP fetch. The RAG request depends only on the processed search text, while the brand query depends on the embedding. REN-151 changes only this scheduling relationship.

In scope: start the RAG fetch concurrently with the embedding/brand sequence, then combine results through the existing predicates and ordering. Preserve exact-brand short-circuiting, filters, ranking, local fallback, response shape, and branch-specific error handling.

Out of scope: REN-146 timeout/endpoint hardening, REN-158 fallback-query behavior, broad refactoring, schemas, migrations, and production performance claims without measurement.

## Requirements

- `REQ-151-001`: For a non-empty search that is not an exact brand match, start the independent RAG fetch without waiting for embedding/brand matching.
- `REQ-151-002`: Preserve existing exact-brand, embedding, threshold, RAG-ID, fallback-predicate, filter, and ordering semantics.
- `REQ-151-003`: Preserve graceful degradation when either independent operation fails.
- `REQ-151-004`: Do not add timeouts, change the endpoint, modify schemas, or refactor unrelated branches.

## Scenarios

- `SCN-151-001`: A normal non-exact-brand search starts both work groups concurrently and preserves result content/order.
- `SCN-151-002`: A slow embedding/brand branch does not delay starting RAG.
- `SCN-151-003`: A slow RAG branch does not change brand-match behavior or output semantics.
- `SCN-151-004`: RAG failure or empty IDs preserves local fallback behavior.
- `SCN-151-005`: Embedding or brand failure preserves the RAG/local-search path.
- `SCN-151-006`: An exact-brand search continues to skip RAG.
- `SCN-151-007`: Non-search and explicit filter/sort requests remain unchanged.

## Invariants and flow

- `INV-151-001`: The brand query never runs before its embedding is available.
- `INV-151-002`: Scheduling changes do not alter returned product content or order for identical inputs and dependency responses.
- `INV-151-003`: One independent failure cannot create an unhandled failure when the other path can complete.
- `INV-151-004`: Exact-brand searches never invoke RAG.

- `FLOW-151-001`: Normalize search → check exact brand → launch RAG and embedding/brand work concurrently → combine through existing logic.
- `FLOW-151-002`: Preserve branch-specific failure handling and local fallback when an external operation fails.

## Dependencies and boundaries

- `DEP-151-001`: Existing embedding and brand vector query; brand matching remains dependent on the embedding.
- `DEP-151-002`: Existing Advanced RAG service; it depends only on processed search text.
- `INT-151-001`: Existing Advanced RAG HTTP endpoint, request, response parsing, and limit.

No authentication, authorization, tenant, payment, inventory, persistence, or schema boundary changes are planned. The exact test seam for module-level external calls must be confirmed during implementation; a broader refactor requires governance re-entry.

## Decisions

- `DEC-151-001` (`AUTO_DECIDE`, resolved): Use branch-local promises or `Promise.allSettled` while retaining existing catches, because failure tolerance is part of current behavior.
- `DEC-151-002` (`AUTO_DECIDE`, resolved): Keep exact-brand handling outside the concurrent block because it is the existing fast path.

## Test expectations

- `TEXP-151-001` (`unit`, REQUIRED): Controlled deferred promises prove RAG starts before embedding/brand resolves.
- `TEXP-151-002` (`integration`, REQUIRED): Successful responses preserve IDs, content, filters, and ordering.
- `TEXP-151-003` (`unit`, REQUIRED): Both external failure directions preserve fallback behavior.
- `TEXP-151-004` (`regression`, REQUIRED): Run existing product-ordering and catalog-query tests.
- `TEXP-151-005` (`performance`, REQUIRED): Capture representative staging p50/p95 timings before and after without inventing a numeric claim.
- `TEXP-151-006` (`external_integration`, REQUIRED): Exact-brand searches skip RAG; non-exact searches preserve the existing RAG contract.

Rollback is a normal revert of the single control-flow change; no migration or data repair is required.
