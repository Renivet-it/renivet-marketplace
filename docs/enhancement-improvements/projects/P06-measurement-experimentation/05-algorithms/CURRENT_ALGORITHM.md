# Current Algorithm(s) — P06

For this Epic, "algorithm" means: event definitions, identity resolution, attribution logic, funnel semantics, and cross-system reconciliation — not ML. Documented here exactly as implemented, verified against source.

## 1. Event definitions (source of truth: `src/config/posthog.ts`)

`POSTHOG_EVENTS.COMMERCE` = `PRODUCT_VIEWED`, `ADD_TO_CART`, `CHECKOUT_STARTED`, `PURCHASE_COMPLETED`. `POSTHOG_EVENTS.CART` = `ADDED` (`cart_added`), `REMOVED`, `BULK_REMOVED`. These are two separate namespaces with overlapping real-world meaning (adding a product to the cart), which is the root of REN-132.

## 2. Identity resolution

- **Anonymous → identified merge**: `posthog.identify(user.id, {email, phone})` called on Clerk sign-in (`identify-bridge.tsx`). PostHog's own anonymous-ID-to-identified-ID merge behavior is inherited as-is from the `posthog-js` SDK default — the codebase does not override or customize merge strategy. `posthog.reset()` on sign-out starts a fresh anonymous ID for the next session.
- **Server-side capture** uses `distinctId: userId` directly (e.g., `cart.ts`'s `posthog.capture({event: ..., distinctId: userId, ...})`) — this assumes the caller is already authenticated (cart routes require a logged-in user), so there is no anonymous-merge concern server-side.
- **CAPI identity**: Meta CAPI uses its own separate identity graph (email/phone hashes, `fbp`/`fbc` cookies, `external_id`) — entirely independent of PostHog's identity resolution. No shared identity layer exists between PostHog and Meta; they are reconciled only by a human comparing dashboards, not by the system.

## 3. Attribution logic

Renivet does not implement its own attribution model in application code. Attribution is delegated entirely to Meta's platform (CAPI + Pixel dedup via shared `eventId`, standard Meta last-touch/data-driven attribution per ad-account settings — not configurable from this codebase) and to PostHog's own UTM/referrer capture on `$pageview` events. There is no last-touch or multi-touch attribution logic written in `src/`. The growth audit's `posthog_funnel_by_utm_source.csv` is a PostHog-side approximation built from raw event UTM properties, not a formal attribution model.

## 4. Funnel semantics

The canonical funnel referenced by the growth audit is: `product_viewed` → `add_to_cart` → `checkout_started` → `purchase_completed`. Each stage is captured independently, client-side, from different components, with no shared session/cart-ID guaranteeing a customer who views a product is the same session that eventually purchases (PostHog's distinct-ID/session mechanisms provide this implicitly, but the application code does not add its own explicit funnel-linking IDs).

## 5. Why PostHog, Meta, and GA4 purchase counts differ (reconciliation logic, as currently implemented — i.e., not implemented as a single mechanism, but explainable from the code)

| System | Count mechanism | Why it differs |
|---|---|---|
| Meta (11) | CAPI + Pixel, deduplicated by `eventId`, subject to Meta's own attribution window and match-quality filtering | Currently receives N events per multi-brand order (REN-145b) and paise-denominated values (REN-145a) that may cause some events to be discarded or misattributed by Meta's own anomaly filtering (PROBABLE, not CONFIRMED, per governing evidence) |
| PostHog raw (15) | Client-side `purchase_completed` captures, no dedup logic against the per-brand fan-out, no strict identity/session filter | Captures every fan-out event PostHog receives client-side; higher than Meta because PostHog applies no equivalent to Meta's attribution-window/match-quality filtering |
| PostHog strict (2) | Same raw events, filtered by a stricter definition (e.g. requiring verified session continuity / identified user match across the funnel) | MEASUREMENT ARTIFACT: the strict filter removes far more events than it should relative to real purchase volume — this is a property of the filter definition, not evidence that only 2 real purchases occurred |
| GA4 (0) | Event never fires — no GA4 SDK/`gtag` call exists in `src/` | Not a counting-methodology difference; the event pipeline simply does not exist (REN-166, CONFIRMED) |

This table explains the *mechanism* behind the 11/15/2/0 spread using verified source-code facts. It intentionally does not attempt to reconcile the exact numbers into a single "true" purchase count — the evidence base does not support that reconciliation, and the program prohibits fabricating it.
