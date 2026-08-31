# Failure Matrix — P02

## Scenario 1: Full external ML host outage (the REN-147 central scenario)

| Placement | Current behavior (CONFIRMED) | Target behavior (post-FR-1) |
|---|---|---|
| A — Cart cross-sell | Primary fails (all 3 items) → fallback (`getEmbedding768`) also fails (same host) → `catch` block returns `[]` → section renders nothing, no error shown to shopper, no signal to business | Primary fails → same-host fallback fails → new independent Postgres fallback tier attempts same-category/platform best-sellers → renders generic-but-present suggestions |
| B — PDP similar products | Primary fails → frontend cascades to same-brand → same-category → best-sellers (all Postgres) → renders best-available tier | Unchanged (already correct) |
| C — Shop personalized sort | Not affected — this placement makes no external ML call at all | Unchanged (not affected) |

## Scenario 2: Partial/intermittent external ML host failure (timeouts, slow responses)

- **Current (CONFIRMED):** no `timeout` option set on any `axios` call in `product-recommendation.ts`/`sematic-search.ts` — a slow/hanging host could hold a request open indefinitely (bounded only by Next.js/infra-level request timeouts, if any — **UNKNOWN** whether such an infra-level bound exists). This is squarely REN-146's territory (P01's issue to harden this shared call pattern with timeouts) — P02's FR-1 does not duplicate that fix, but benefits from it once shipped (see `DEPENDENCIES.md`).
- **Target:** post-REN-146 (P01), calls fail fast on timeout, which then correctly triggers FR-1's fallback tier rather than hanging.

## Scenario 3: Stale-but-wrong cached recommendation (new risk introduced by FR-4, REN-160)

| Risk | Mitigation (per `03-requirements/BUSINESS_RULES.md` BR-1) |
|---|---|
| Cached product later goes out of stock/deactivated within TTL window | Read-time re-validation of availability flags already happens downstream in every placement's hydration query (confirmed — `isAvailable`/`isActive`/etc. filters are applied when hydrating full product rows, which would need to remain applied even to cached ID lists) — a cached *ID list* being re-validated against live availability at read time is a straightforward mitigation; a cached *fully-hydrated* result would need either short TTL or an explicit re-check. **DECISION REQUIRED:** cache ID lists (safer, requires a re-hydration read) vs. cache fully hydrated results (faster, riskier) — see `06-data/DATA_CONTRACTS.md`. |
| Cross-user cache leakage (Placement C, keyed by `userId`) | Mandatory correct cache-key scoping (NFR-6) — a code-review-enforced requirement, not an automatic guarantee |

## Scenario 4: Race conditions on cart changes (cart cross-sell specific)

- **Current (CONFIRMED):** `wardrobe-suggestions.tsx:124-127` explicitly invalidates the `getWardrobeSuggestions` query on successful add-to-cart, so the suggestions panel refetches after a cart mutation — this is already handled correctly and is not a defect.
- **New consideration under FR-4.2:** since the proposed cache for Placement A is keyed by `productId` (not by cart state), adding/removing cart items does not invalidate anything in that cache incorrectly — the per-product cache entries remain valid regardless of cart composition changes. This is a point in favor of the `productId`-keyed design (per `05-algorithms/DECISION_LOGIC.md`) — it is inherently race-condition-safe with respect to cart mutations, since cart state was never the cache key.

## Scenario 5: Shop-page personalization signal update lag (Placement C, FR-4.1)

- A shopper who wishlists an item, then immediately visits `/shop`, might see a personalized cache entry computed *before* the wishlist action, if TTL hasn't expired. Mitigated by proposing a short TTL (minutes, per NFR-4) — this is an accepted, bounded staleness tradeoff, not eliminated entirely. **DECISION REQUIRED** on exact TTL value; not fully eliminable without event-driven invalidation, which FR-4.3 explicitly does not require for V1.

## Out of scope for this matrix

Failure modes of the external ML host's own internal operation (model errors, data corruption on their side) are outside Renivet's codebase and this Epic's remediation surface — covered only insofar as REN-146/147 make Renivet's side resilient to that host failing, not by attempting to fix the host itself.
