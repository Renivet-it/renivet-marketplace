# REN-239 — Media Cache Resilience

## Goal

Make media cache reads use the canonical `media:${id}:${brandId}` key, preserve DB fallback, and add finite expiry as a safety net.

## Scope and design

- Fix shared MGET fallback to return one `null` per requested key so every miss reaches the existing DB fallback.
- Remove wildcard MGET construction; exact keys require brand context, with existing callers and returned media shape preserved.
- Keep existing `getByIds(ids)` and `get(id)` return shapes. When a caller has only media IDs, first use the existing Postgres lookup to obtain each item's `brandId`, then issue exact canonical MGETs; callers that already have brand context may use exact-key reads directly. No caller receives a new field or a different result shape.
- Align `get`, `add`, `addBulk`, and `remove` on `media:${id}:${brandId}`. Keep explicit `drop()` invalidation.
- Add a 24-hour TTL to media cache writes. Explicit media create/update/delete paths already call brand-level `drop`, so TTL is only a disposable safety net for missed invalidation or stale cache entries; media is editable and should not retain stale content for the cart/product cache week.
- Do not add a malformed-key migration and do not redesign `getAll` SCAN.
- Legacy `media:${id}` and wildcard-shaped keys are not read or migrated; they become unreachable. Existing explicit invalidation is best-effort, with the 24-hour TTL bounding missed-invalidation staleness.

## Required test evidence

- MGET failure returns N null entries and callers perform DB fallback.
- Exact canonical keys are used for get/add/bulk/remove and no wildcard MGET is emitted.
- Explicit drop remains available; TTL is present on all writes.
- Existing media caller return shape and DB fallback behavior remain unchanged.
