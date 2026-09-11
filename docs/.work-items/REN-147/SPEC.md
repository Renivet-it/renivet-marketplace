# REN-147 — Cart cross-sell fallback independent of the ML host

## Summary

Cart wardrobe suggestions currently depend on two recommendation paths that
both call the same external ML host. When that host is unavailable, the cart
silently shows no cross-sell products. Add a final, deterministic catalog query
that recommends eligible best-selling products from the categories already in
the cart.

## Scope

In scope:

- Add a final local-database fallback to `getWardrobeSuggestions` in
  `src/lib/trpc/routes/general/cart.ts`.
- Build fallback candidates from the cart products' category IDs.
- Exclude every product already in the cart and preserve current product
  eligibility rules and the existing response shape.
- Log that the deterministic fallback was used without including customer or
  cart identifiers.
- Add focused automated coverage and an unreachable-ML manual verification.

Out of scope:

- Changing ML endpoint timeout/configuration work tracked by REN-146.
- Changing the primary recommendation matching algorithm.
- Changing cart UI copy or its existing deliberate empty state.
- Database schema, cache-key, product mutation, or checkout changes.

## Requirements

| ID | Requirement |
| --- | --- |
| REQ-147-001 | Keep the current advanced-recommendation result path as the highest-priority path. |
| REQ-147-002 | Keep the current embedding/vector result path as the second-priority path when advanced recommendations yield no usable product IDs. |
| REQ-147-003 | When both ML-backed paths fail or produce no candidates, query the local catalog deterministically using distinct non-empty category IDs from the cart, ordered by the existing best-seller/recommended ordering available to the catalog query. |
| REQ-147-004 | The local fallback must never call an ML endpoint, must exclude all cart product IDs, and must apply the existing active, available, published, not-deleted, and approved-product constraints. |
| REQ-147-005 | The fallback returns at most the existing suggestion limit and uses the same normalized product-card shape and media enrichment as the other paths. |
| REQ-147-006 | If no eligible category-based fallback candidates exist, return `[]` as the deliberate existing empty state. |
| REQ-147-007 | Emit a concise warning/telemetry event when the deterministic fallback is selected, without user IDs, product IDs, search text, or other customer data. |

## Design decisions

- **DEC-147-001:** Keep all three tiers inside `getWardrobeSuggestions` so the
  route continues to own prioritization, product eligibility, and response
  shaping. This avoids routing a server procedure through another procedure
  with a different response contract.
- **DEC-147-002:** Use category IDs already present in the cached cart product
  data. This produces a deterministic, relevant result without an additional
  remote dependency.
- **DEC-147-003:** Preserve the existing UI and its hidden empty state. The
  current AI-oriented copy is intentionally unchanged because UI copy is out
  of scope for this issue; a later task may distinguish local recommendations.
- **DEC-147-004:** A category-less cart, or categories with no eligible
  products, is a valid no-candidate case and returns `[]`; the fallback must
  not broaden to unrelated catalog products.

## Behavior matrix

| Condition | Expected behavior |
| --- | --- |
| Advanced recommendation IDs produce eligible products | Return those products unchanged. |
| Advanced recommendations have no usable IDs; vector search succeeds | Return vector-search results unchanged. |
| ML host is unreachable for advanced and embedding calls | Return local eligible category-based products, if any. |
| ML paths fail and no category-based candidate exists | Return `[]`; the existing cart UI deliberately renders no suggestions. |
| Cart is empty | Return `[]` without calling ML or the fallback query. |
| Cart products have no usable categories | Return `[]` after ML paths are unavailable/no-candidate; do not show unrelated products. |

## Invariants and boundaries

- The existing protected cart route boundary remains unchanged.
- No suggestion can be a product already present in the cart.
- The fallback reads catalog data only; it does not alter cart, product,
  recommendation, or cache state.
- Successful existing ML responses retain priority over deterministic results.
- Each returned product continues to meet existing storefront visibility and
  availability constraints.
- The public tRPC response contract and cart component interface do not change.

## Dependencies and integrations

- Cart cache provides the in-cart products and their category IDs.
- Advanced recommendation and embedding/vector services remain best-effort
  upstream tiers only.
- Local catalog, variant, brand, and media data provide the independent final
  fallback and its current card fields.

## Verification plan

- Unit test category extraction, de-duplication, and no-category behavior.
- Router/integration coverage: rejected ML calls with eligible local catalog
  candidates returns normalized cards; rejected ML calls with no candidates
  returns `[]`; successful primary results remain preferred.
- Assert fallback candidates exclude cart IDs and honor storefront eligibility.
- Manually point staging at an unreachable ML host, load a cart containing a
  categorized product, and confirm suggestions render from the local catalog.
- Run `bun test` and the governance validator.

## Rollback

Revert the REN-147 implementation commit. This restores the prior ML-only
behavior and requires no data repair because this change is read-only.
