# Success Metrics — P05 Customer Journey & UX

## REN-144
- Primary: rate of captured payments with incomplete order sets, target near-zero post-fix, measured via the new reconciliation record (FR-1.3) rather than customer reports.
- Leading indicator (available immediately, pre-fix): number of support tickets tagged as "charged, no order" per period — should decline to zero once the fix and detection ship.

## REN-95
- Guest checkout completion rate (once shipped) vs. historical forced-login cart abandonment rate at the checkout step.
- Decision-queue closure: all 6 blocking items resolved (a process metric, gating implementation start).

## REN-152
- Number of independent implementations of checkout business logic: target 1 (from the current 2 full implementations + a 3rd partial duplicate of the coupon logic).

## REN-153
- Rate of checkout sessions where the cart total changes between cart view and checkout view due to availability exclusion: target near-zero post-fix (customer sees the exclusion in the cart, so the checkout total should already match).

## REN-161
- Presence of accurate disclosure copy: binary, verified via manual QA rather than a numeric metric.

## REN-163
- Rate of post-cancellation sessions where the customer re-initiates the same purchase within the same session, as a rough proxy for "did the redirect return them somewhere useful" (directional only, not a hard target — INFERRED as a reasonable proxy, not validated against existing analytics in this pass).
