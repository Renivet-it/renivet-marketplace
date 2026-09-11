# Business Requirements — P06

## BR-1: Ad-spend value must reflect actual order value

Meta Purchase events must report order value in the same currency unit Renivet actually transacts in (rupees), not the internal storage unit (paise). Source: REN-145. Rationale: budget allocation and CPA/ROAS decisions are made directly from Meta's reported conversion value; a ~100x unit error (when it manifests) makes every derived metric meaningless for that event.

## BR-2: One purchase = one conversion event

A single customer checkout, regardless of how many brands are in the cart, must produce exactly one Purchase conversion signal per sales channel (one PostHog `purchase_completed`, one Meta Purchase). Source: REN-145 (fan-out), REN-133 (duplication). Rationale: Meta's campaign optimization and reported purchase counts are directly distorted by artificial event multiplication.

## BR-3: Purchase completion must be measurable even if the client fails

Order-completion measurement must not depend solely on a customer's browser tab remaining open and executing JS after payment succeeds. Source: REN-131. Rationale: mobile backgrounding, tab closes, and client-side errors are routine ways real purchases go unmeasured today.

## BR-4: Funnel-stage events must have consistent, documented trigger semantics

Every event that feeds a funnel comparison (e.g., `add_to_cart` vs `cart_added`) must have a single, documented definition of what user/system action triggers it, so cross-event ratios are interpretable rather than an artifact of differing trigger surfaces. Source: REN-132.

## BR-5: Analytics naming must reflect actual runtime behavior

Code that names a client should say which side it runs on. Source: REN-134. Low severity, but a genuine reduce-confusion requirement for anyone extending PostHog instrumentation.

## BR-6 (business, non-engineering): Reassess `Remarketing_Sara` and Instagram Reels allocation

Not a system requirement — a business decision requirement. Given `Remarketing_Sara` produced 82% of Meta-attributed purchases at a 4.9x better CPA and is currently paused, and Instagram Reels consumed 33.8% of spend with zero attributed purchases, marketing/growth should evaluate reactivating the former and re-examining the latter. This does not depend on any other requirement in this document and can be acted on immediately. See `00-context/BUSINESS_CONTEXT.md`.

## Out of scope for this Epic

- Computing CAC, LTV, retention, or brand/category profitability — the evidence base does not support this and the program prohibits fabricating it. Any such analysis is UNKNOWN until a dedicated, sufficiently-instrumented pass exists.
- Deciding whether GA4 is needed (DECISION-P06-001) — a product decision, not an engineering requirement, tracked in `docs/enhancement-improvements/07-decisions/DECISION_QUEUE.md`.
- Reproducing/confirming the REN-164 init-timing race — verification work that should complete before that item is either accepted or closed.
