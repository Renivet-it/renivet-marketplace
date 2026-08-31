# Architecture Critique — P01

## What's genuinely good about the current design

- Independent try/catch per external-call branch (brand embedding, RAG fetch) means partial failures already degrade gracefully — CONFIRMED, this is a resilient pattern that this Epic preserves rather than needing to invent.
- The exact-brand-match short-circuit (skip the external call entirely when the query is literally a brand name) is a sensible, cheap optimization already in place.
- Two-subsystem separation (intent classification vs. candidate retrieval/ranking) is not inherently wrong — it's reasonable for these to be independently testable/deployable concerns. The problem is not the separation, it's that one subsystem's output (REN-149) is computed and discarded at the seam.

## What's weak

1. **The seam between Subsystem A and B is undocumented and easy to get wrong.** REN-149 is exactly the kind of bug that happens when two systems' contracts aren't visible to each other's maintainers — `product-search.tsx` calls both, but nothing in the code makes the relationship between `processSearch`'s `redirectUrl` and `getProducts`'s `search` param obvious. This document (`04-architecture/SYSTEM_ARCHITECTURE.md`) is the first place that relationship is drawn explicitly.
2. **Configuration is buried in commented-out dead code, three times over** (`sematic-search.ts`, `ai-suggestion.ts`, the suggestions route) — the same wrong pattern (hardcoded IP alongside an unused env-var fallback) was copy-pasted across files rather than centralized. REN-146 should fix all instances, not just one, and ideally centralize the client into a single shared module — but see `11-critique/ANTI_OVERENGINEERING_REVIEW.md` on not overbuilding that consolidation.
3. **`getProducts()` is a 600+ line function inside a 6,422-line file** doing candidate generation, filtering, ranking, and post-processing all in one place. This is not something this Epic proposes refactoring (out of scope, high risk relative to the value), but it is worth naming as a standing maintainability cost that makes every future fix here riskier than it should be — a future initiative to decompose this function (behavior-preserving, well-tested) would be worthwhile, but is explicitly not this Epic's job.

## Recommendation

Fix the seam (REN-149) and the config duplication (REN-146) now, as scoped. Do not use this Epic as cover to refactor `getProducts()`'s overall structure — that is a larger, riskier undertaking that deserves its own scoping and its own regression-test investment, not a rider on nine already-well-defined small fixes.
