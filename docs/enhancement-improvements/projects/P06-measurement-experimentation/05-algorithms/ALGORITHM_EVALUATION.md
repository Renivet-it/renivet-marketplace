# Algorithm Evaluation — P06

## What "correctness" means here

There is no accuracy/precision/recall metric to compute — these are deterministic event-firing rules, not a predictive model. Evaluation is binary per requirement: does the code path fire the right event, the right number of times, with the right value, from the right trigger?

## Evaluation against current code (this pass's findings)

| Rule | Currently correct? | Evidence |
|---|---|---|
| Meta value in rupees | NO | `totalAmountPaise`/`variables.totalAmount` passed directly, both files |
| One Purchase event per checkout | NO | Fires once per brand via `buildOrderDetailsByBrand()` fan-out |
| Server-side purchase capture exists | NO | Zero occurrences in backend order-creation path |
| Purchase instrumentation is DRY | NO | Duplicated across two files |
| `add_to_cart`/`cart_added` have distinct, sound rationale | YES (rationale is sound; documentation is what's missing, not the design) | See `DECISION_LOGIC.md` |
| PostHog identify/reset on auth state change | YES | `identify-bridge.tsx`, shipped |
| CAPI dedup via shared eventId | YES | Correctly implemented, reused as-is in the target design |
| CAPI audit logging | YES | `capiLogs`, regardless of success/failure |
| GA4 e-commerce events | N/A (not built, correctly deferred) | No code exists; not a "wrong algorithm," an absent one |

## Risk of over-fixing

A tempting "better" design would be a single shared `emitCommerceEvent()` abstraction fanning out to PostHog+Pixel+CAPI+GA4 uniformly. This is evaluated in `07-feasibility/BUILD_REUSE_BUY_SIMPLIFY.md` as **not V1-justified** — the V1 fixes (currency unit, event count, server capture, dedup) do not require this abstraction to be built first, and building it prematurely risks scope creep on a P0-urgent fix (REN-145) that should ship fast. Revisit the abstraction only if a V2/V3 GA4 addition makes the fan-out genuinely repetitive across four systems instead of three.
