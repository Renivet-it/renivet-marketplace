# REN-147 Independent Critique

## Outcome

**RECOMMEND_CONTINUE** — no blocking ambiguity was found. The implementation
must retain the stated boundaries below.

## Findings

| ID | Severity | Finding | Required handling |
| --- | --- | --- | --- |
| CRIT-147-001 | Minor | A category fallback can accidentally recommend an item already in the cart. | Exclude the complete cart product-ID set at query time and cover it with a test. |
| CRIT-147-002 | Minor | A fallback that uses embeddings, advanced recommendations, or another remote recommender would retain the same outage dependency. | Keep the final tier local database-only and test rejected ML calls. |
| CRIT-147-003 | Minor | Catalog results must not expose unavailable, unpublished, deleted, or unapproved products. | Reuse the existing storefront eligibility constraints in the fallback query. |
| CRIT-147-004 | Minor | Existing UI copy describes AI similarity even when the fallback is local. | Preserve copy per issue scope and document the limitation rather than widening this task. |
| CRIT-147-005 | Minor | Fallback diagnostics could leak customer/cart details. | Use a concise event without user IDs, product IDs, search text, or cart contents. |

## Independent checks performed

- Scope and acceptance criteria reconcile with the cart router and cart UI.
- Existing advanced and vector tiers are confirmed to share the ML dependency.
- The proposed final tier has no mutation, payment, authorization, schema, or
  external write behavior.
- Manual staging verification explicitly exercises the failure condition that
  caused the issue.
