# Data Contracts — P05 Customer Journey & UX

## `orders` table (current contract, CONFIRMED — `src/lib/db/schema/order.ts`)
- `userId: text NOT NULL REFERENCES users(id) ON DELETE CASCADE` — the exact constraint REN-95 must resolve or work around.
- `paymentStatus` enum includes `pending | paid | failed | refund_pending | ...` (truncated in read) — a state relevant to whether a "partial order" scenario is even representable today; whether a distinct state for "payment captured, order-creation incomplete" exists was not verified beyond what was read (UNKNOWN — worth confirming during REN-144 implementation).

## `ordersIntent` table (current contract, CONFIRMED — used in `orders-intent.ts` / `orders.ts`)
- Carries an `orderLog` JSONB-style field updated per successfully created order with `{ step, status, timestamp, details: { orderId, brandId, totalAmount } }`. This is an append/overwrite progress marker, not a structured state machine field — FR-1.3 requires either extending this contract with an explicit status enum or introducing a new table with one.

## Cross-surface contract requirement (REN-152, FR-4)
Whatever shared checkout module emerges must define one contract for `orderDetailsByBrand`-equivalent data (currently defined ad hoc, slightly differently, in each of the three checkout surfaces) — this is the artifact that should be unified first, since every other piece of consolidation (coupon, tax, availability) flows into building this structure.

## Cart-to-checkout contract (REN-153, FR-3)
The cart view and checkout should consume the same availability-annotated cart-item shape — today `getCartForUser` returns raw cart items and only `checkout-content.tsx` derives `availableItems` from them. FR-3/FR-4 implies moving that derivation to a shared, reusable selector consumed by both cart and checkout components.
