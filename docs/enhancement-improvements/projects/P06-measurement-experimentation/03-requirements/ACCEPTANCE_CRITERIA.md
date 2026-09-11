# Acceptance Criteria — P06

## REN-145 (currency + fan-out)
- Given a single-brand checkout of ₹1,000 (100,000 paise), when the Purchase event fires, the Meta Pixel and CAPI `value` field equals `1000`, not `100000`.
- Given a multi-brand checkout (e.g., 3 brands) totaling ₹1,000, when checkout completes, exactly one Meta Purchase event (Pixel) and one Meta Purchase event (CAPI) are sent, with combined value equal to ₹1,000 — not three events summing (in paise) to ₹100,000-equivalent distortion.
- CAPI logs (`capiLogs` table) show one "Purchase" row per checkout, not one per brand, post-fix.

## REN-131 (server-side capture)
- Given a successful order creation at the backend/database level, a `purchase_completed` PostHog event is recorded even if the client's browser tab is closed immediately after payment confirmation (simulated by not invoking the client `onSuccess` handler).

## REN-133 (consolidation)
- Only one code module constructs the `purchase_completed` payload; both `checkout-content.tsx` and `order-payment-page.tsx` (or their post-refactor equivalents) call it rather than duplicating field-mapping logic.

## REN-132 (event semantics)
- A written definition exists (see `05-algorithms/DECISION_LOGIC.md`) stating exactly what user/system action triggers `add_to_cart` versus `cart_added`, referenced from any dashboard that compares them.

## REN-134 (naming)
- `src/lib/posthog/client.tsx` (or its replacement path) no longer shares a generic `client` name with an unrelated browser-side usage; a reader can tell from the file path alone that it is the server-side client.

## REN-166 (GA4, DEFERRED — acceptance criteria apply only if DECISION-P06-001 approves GA4)
- Not applicable until the decision is made. If approved: `ga4_device_sessions`-equivalent live data shows non-zero `conversions_purchase` after a real test purchase.

## REN-164 (verification)
- A documented test (manual or automated) either reproduces PostHog capture-call loss during the init window, or documents that no loss occurs — closing the item either as a confirmed defect or as "verified not an issue," not left ambiguous.
