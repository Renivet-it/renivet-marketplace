# Anti-Overengineering Review — P06

Consistent with `docs/enhancement-improvements/PORTFOLIO_ANTI_OVERENGINEERING.md`'s program-wide discipline, this review explicitly checks this Epic's own package for overreach.

## Rejected: building the shared commerce-event abstraction now
Covered in `07-feasibility/BUILD_REUSE_BUY_SIMPLIFY.md`. Restated here as the single biggest overengineering temptation in this Epic — "while we're in here fixing REN-145, let's build it right" is exactly the instinct this review exists to catch. Rejected for V1.

## Rejected: merging `add_to_cart` and `cart_added` into one event
Covered in `07-feasibility/ALTERNATIVES.md`. The two events serve genuinely different purposes; forcing them into one for "cleanliness" would break existing dashboards for no evidenced benefit.

## Rejected: building a custom attribution model
Renivet correctly delegates attribution to Meta/PostHog platform mechanisms. Nothing in the evidence suggests platform-provided attribution is insufficient — only that the *inputs* to it (REN-145) are wrong. Fix the inputs; do not build a bespoke attribution engine.

## Rejected: retroactively "correcting" historical Meta data
Covered in `08-reliability/RECOVERY_ROLLBACK.md`. Tempting to want a clean historical dataset, but the true historical values are not recoverable to certainty, and presenting a reconstructed estimate as fact would violate the program's evidence discipline.

## Rejected: computing CAC/LTV/ROI from available data
Repeatedly flagged throughout this package (per explicit governing instruction) — the evidence base does not support it. Worth restating in the anti-overengineering review because "let's just calculate ROI while we're documenting this" is a natural drift for anyone reading the Remarketing_Sara finding and wanting to quantify it further.

## Accepted as right-sized
The V1 scope (REN-145, 131, 132, 133, 134) is five small, independently-shippable, source-confirmed fixes. This is the correct scope — no larger, no smaller, given the evidence.
