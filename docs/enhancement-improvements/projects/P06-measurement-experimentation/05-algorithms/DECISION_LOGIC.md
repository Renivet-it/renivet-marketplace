# Decision Logic — P06

## Why `add_to_cart` and `cart_added` are two different events (and should probably stay that way)

| | `add_to_cart` | `cart_added` |
|---|---|---|
| Fired from | Client (`useAddToCartTracking.ts`), one call site | Server (`cart.ts`, `wishlist.ts` tRPC routes), two call sites (new item + quantity increment) |
| Represents | User-initiated *intent* to add a product, captured at UI-interaction time | Confirmed backend *mutation* — the cart row actually changed in the DB |
| Fires on quantity increment of existing item? | Depends on whether the calling UI invokes the hook again (implementation-dependent, not verified either way in this pass) | YES — both branches (new item, existing item) call `posthog.capture(CART.ADDED, ...)` unconditionally |
| Survives client JS failure? | No — lost if client JS doesn't execute | Yes — fires from the backend regardless of client state |
| Includes wishlist→cart moves? | Not verified (hook is UI-triggered; depends on which UI paths call it) | YES — `wishlist.ts` also fires `CART.ADDED` on wishlist-to-cart moves (lines ~240, ~360) |

**Decision**: these are legitimately different signals (intent vs. confirmed mutation) and REN-132's fix should NOT be "merge them into one event." The correct fix is documentation + dashboard clarity: anyone comparing the two numbers needs to know `cart_added` has more triggering surfaces (unconditional server mutation, including quantity bumps and wishlist moves) than `add_to_cart` (single client hook, JS-dependent). This structural asymmetry is a CONFIRMED, sufficient explanation for *why a large discrepancy would exist*; the exact 4.3x figure is not independently re-derived in this pass (INFERRED consistency only).

## Why the Meta Purchase event is wrong (decision trace)

1. Is the rupee-conversion utility available at the call site? **Yes** — `convertPaiseToRupees` is imported and used by the adjacent PostHog capture in the same function, in both files.
2. Is it applied to the Meta-bound value? **No**, in both files, at both the Pixel (`fbEvent`) and CAPI (`trackPurchaseCapi`) call sites.
3. Is the Purchase-firing point scoped to "one checkout" or "one order record"? **One order record** — the `onSuccess` handler of the `createOrder` mutation, which is invoked once per brand via `buildOrderDetailsByBrand()` + a loop (COD) or per-brand Razorpay callback invocation.
4. Conclusion: both defects are independently traceable to specific, unconditional code paths, not intermittent or environment-dependent behavior — hence "CONFIRMED at the source-code level."
5. Whether this *manifests* as a clean, full-period 100x runtime distortion in Meta's reported numbers is a separate question the source code cannot answer alone (Meta may apply its own filtering/dedup/anomaly-detection that partially absorbs bad events) — hence "PROBABLE, not CONFIRMED" for the runtime-impact magnitude specifically. Do not collapse these two distinct claims into one.

## Why GA4 shows zero (decision trace)

1. Does any code call `gtag(...)` or import a GA4/Google Analytics SDK? **No**, codebase-wide search returned no matches in `src/`.
2. Is the growth-audit's `ga4_device_sessions.csv` showing zero purchases/revenue consistent with "GA4 not wired up" vs. "GA4 wired up but zero real purchases occurred in that channel"? **Consistent only with "not wired up"** — session/engagement data is present and non-zero in the same file, meaning the GA4 *pixel/tag* is firing for page views but the *e-commerce* event layer specifically was never implemented.
3. Conclusion: REN-166's premise is CONFIRMED; the fix (if approved) is net-new instrumentation work, not a bug fix.
