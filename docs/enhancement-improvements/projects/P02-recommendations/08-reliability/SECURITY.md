# Security — P02

## Current state (CONFIRMED)

- No PII beyond `userId` is transmitted to the external ML host by any P02 code path — only `productId` or derived product title/brand text is sent (`product-recommendation.ts`, `sematic-search.ts`). This is a positive existing property, preserved (not changed) by this Epic's fixes.
- `getWardrobeSuggestions` and `updateProductQuantityInCart`-style procedures enforce `userId === ctx.user.id` authorization checks (`cart.ts`, throughout) — recommendation-adjacent procedures inherit this pattern; `getRecommendations` (PDP) and `getShopRecommendations` are `publicProcedure` (no auth required), which is appropriate since they don't expose any user-specific data beyond what a public visitor should see (product similarity for a given product ID is not sensitive).
- The external ML host is called over what appears to be **plain HTTP, not HTTPS** (`http://64.227.137.174:8000` — confirmed literal scheme in all three call sites). This means request/response data (product IDs, generated text for embeddings) transits unencrypted. **CONFIRMED as a pre-existing condition**, not introduced by this Epic. Not one of the six tracked Linear issues, so this package does not treat it as in-scope to fix — flagged here for completeness per SRS discipline, and cross-referenced to P01 (which shares this same host/scheme) as a candidate for its own finding if not already tracked there.

## New security considerations introduced by V1 fixes

- **FR-4 caching (REN-160):** per NFR-6, any per-`userId`-keyed cache (Placement C) must not leak one shopper's personalized recommendation list to another shopper due to a cache-key bug (e.g., a missing `userId` in the key, or a shared/global cache namespace collision). This is a standard but real risk category for any new per-user cache and must be verified in code review/testing before shipping FR-4.1.
- **FR-1's new fallback tier** reuses existing, already-reviewed `getProducts`-style query patterns — no new security surface introduced (same authorization model, same data exposure profile as existing best-seller/category listing queries used elsewhere in the app).

## Not assessed / out of scope

- Full security review of the external ML host itself (outside Renivet's codebase/control).
- Any authentication/API-key hardening of calls to the external host (no API key or auth header is present in any current call — **CONFIRMED absence**, but changing this is not requested by any of the six tracked Linear issues; noting it here as a fact, not proposing it as new scope for this Epic).
