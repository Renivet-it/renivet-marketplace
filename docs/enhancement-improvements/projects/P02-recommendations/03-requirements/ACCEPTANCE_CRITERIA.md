# Acceptance Criteria — P02

## AC-1 (REN-147 / FR-1 / US-1)

- Given the external ML host (`64.227.137.174:8000`) is fully unreachable, and a shopper has ≥1 item in cart, when the shopper views the cart page, then the cross-sell section renders a non-empty, non-ML-dependent set of suggestions (e.g., same-category/brand best-sellers) instead of rendering nothing.
- Given the external ML host is reachable and returns valid results, when the shopper views the cart page, then behavior is unchanged from today (primary ML-based path is preferred).
- Given both the ML host and the independent DB fallback yield zero results (genuine no-suggestions case), when the shopper views the cart page, then the section does not render (unchanged from today) — no error is shown to the shopper.
- Given the fix ships, the `EMBEDDING_SERVICE_URL` env var either controls the actual request host or is removed — no dead configuration remains.

## AC-2 (REN-150 / FR-2 / US-2)

- Given a signed-in shopper with a `getPersonalizedRecommendations` result of N ranked products, when they view the default "Recommended" shop sort, then products earlier in that ranked list appear no later, on average, than products later in the list — i.e., ordering is monotonic-or-bucketed-finer-than-binary with respect to the computed rank (exact scheme per `05-algorithms/DECISION_LOGIC.md`).
- Given the fix ships, the code comment above the ordering logic accurately describes the implemented behavior (verifiable by code review, not runtime testing).
- Given a shopper with no personalization signal (new account, no history), when they view the shop page, then they see the existing platform-defaults fallback, unchanged.

## AC-3 (REN-157 / FR-3 / US-3)

- Given the copy changes ship, cart cross-sell and PDP similar-products copy no longer contains phrases implying basket-composition-aware or complementary-item judgment (specific strings listed in FR-3.2 are changed or removed).
- Given a stakeholder or QA reviewer reads the revised copy without seeing the underlying code, the copy's claims are verifiable against the actual single-item-similarity computation (i.e., a "similarity" claim is accurate; a "complements"/"pairs with your cart" claim is not present).

## AC-4 (REN-160 / FR-4 / US-4)

- Given the same product/user recommendation request is made twice within the cache TTL window, the second request is served from cache (verifiable via added logging/metrics per NFR-7, or via measured latency drop) rather than re-invoking the external ML host or re-running the full DB scoring cascade.
- Given a cached entry has expired (TTL elapsed), the next request recomputes and repopulates the cache — no permanently stale state.
- Given two different shoppers request personalized shop-page recommendations, their cached results are not cross-contaminated (per NFR-6).

## AC-5 (REN-165 — verification acceptance, not a build AC)

- Verification is considered complete when there is a documented answer (backed by data, not opinion) to: "would a post-purchase recommendation surface plausibly move a measurable business metric (repeat-purchase rate, AOV on next order, etc.) enough to justify build cost?" A GO/NO-GO/INSUFFICIENT-DATA verdict, not a shipped feature, is the deliverable for this AC. See `09-validation/EXPERIMENT_STRATEGY.md`.

## AC-6 (REN-168 — explicitly no acceptance criteria)

- Not applicable. No build AC is defined because no build is authorized. Acceptance criteria for this item would only be written once `10-roadmap/VERSION_TRIGGERS.md`'s gating condition is met and a separate scoping pass occurs.
