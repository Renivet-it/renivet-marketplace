# Data Contracts — P06

## `CapiCustomData` (existing, `src/lib/fb-capi.ts`)
```
value?: number        // MUST be rupees post-fix; currently receives paise for Purchase events
currency?: string      // "INR", correctly set throughout
content_ids?: string[]
order_id?: string      // currently unused in the Purchase call sites reviewed; a natural place to carry a checkout-level ID post-fix
```

## PostHog `purchase_completed` properties (existing, both call sites)
```
order_ids | order_id
product_ids: string[]
brand_ids: string[]
total_amount: number   // already correct (rupees, via convertPaiseToRupees)
currency: "INR"
total_items: number
payment_method: string
```
No contract change required for PostHog's side — it is already correct. The contract violation is entirely on the Meta-bound side (`fbEvent`/CAPI `value`).

## `POSTHOG_EVENTS` registry (`src/config/posthog.ts`)
Stable, typed `as const` object — safe to reference by key; no proposed changes to its shape.

## GA4 (future, if approved)
No contract exists yet. If DECISION-P06-001 approves GA4, define e-commerce event contracts (`add_to_cart`, `purchase`, etc.) mirroring GA4's standard e-commerce schema — not specified further here, as it is explicitly out of V1 scope.
