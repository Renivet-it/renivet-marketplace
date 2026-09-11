# Decision Logic — P05 Customer Journey & UX

## Decision: is this cart item purchasable? (current, checkout-time only)
```
purchasable = product.isPublished
  AND product.verificationStatus === "approved"
  AND !product.isDeleted
  AND product.isAvailable
  AND (product.quantity > 0 OR product.quantity is not tracked)
  AND product.isActive
  AND (no variant selected OR (variant exists AND !variant.isDeleted AND variant.quantity > 0))
  AND item.status
```
Source: `checkout-content.tsx` `availableItems` predicate (CONFIRMED). Target: same predicate, evaluated in the cart view too (FR-3).

## Decision: should TRYNEW20 auto-apply? (current)
```
IF cartValue > ₹3,000 AND no coupon currently applied AND not mid-check:
    silently attempt to validate and apply TRYNEW20
ELSE IF cartValue <= ₹3,000 AND TRYNEW20 is applied:
    silently remove it
```
No customer-eligibility branch exists client-side (CONFIRMED). Server-side eligibility logic is UNKNOWN (not traced) — this is the exact gap FR-5.1 requires closing before disclosure copy can be written correctly.

## Decision: was order creation successful enough to tell the customer "success"? (current — the core defect)
```
IF createdOrders.length > 0:
    tell customer "Order Placed Successfully"
ELSE:
    show error
```
This is a `> 0`, not `=== brandCount`, check (CONFIRMED) — the root cause of REN-144's customer-facing symptom. Target logic (FR-1.2): success is `all brands AND all items succeeded inside one transaction`; anything else is not shown to the customer as success.

## Decision: where to redirect after payment cancellation? (current)
```
ALWAYS redirect to "/mycart"
```
No branching on origin context. Target (FR-6.1): branch on `isBuyNow` / `isSwapReward` query-param context already available in `checkout-content.tsx`.
