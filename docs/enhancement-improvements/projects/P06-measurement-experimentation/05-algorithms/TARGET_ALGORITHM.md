# Target Algorithm — P06 (V1 scope only; conceptual, not a mandated design)

## 1. Event definitions
No change to the event-name registry itself. `add_to_cart` and `cart_added` remain distinct (see `DECISION_LOGIC.md` for why this is correct to keep, not a bug to merge). `purchase_completed` remains a single logical event but must be emitted exactly once per checkout (see below).

## 2. Purchase-completion emission (fixes REN-145, REN-131, REN-133)

Target behavior, expressed as pseudocode-level intent (implementation is an engineering decision, not mandated here):

```
on checkout completion (all N brand-orders for this cart confirmed):
    total_rupees = convertPaiseToRupees(sum of all brand subtotals)
    checkout_event_id = <stable ID for this checkout, e.g. orderIntent.id>

    emit_once(
        posthog.capture("purchase_completed", {
            order_ids: [all N order IDs],
            total_amount: total_rupees,
            currency: "INR",
            ...
        }, distinctId = user.id or session ID),
        pixel.fire("Purchase", { value: total_rupees, currency: "INR", ... }, eventId = checkout_event_id),
        capi.send("Purchase", { value: total_rupees, currency: "INR", ... }, eventId = checkout_event_id)
    )
```

Key properties this must satisfy (traceable to `03-requirements/ACCEPTANCE_CRITERIA.md`):
- Fires exactly once per checkout, not once per brand-order.
- Uses rupees, not paise, for every Meta-bound value field.
- Reuses the existing `eventId`-based Pixel/CAPI dedup mechanism — do not invent a new one.
- Should be triggerable from a server-side point (not solely a client `onSuccess`) to also satisfy REN-131; the exact mechanism (webhook, cron reconciliation, order-intent-linking hook) is an implementation choice for whoever picks up the fix, not specified here.

## 3. Identity resolution
No change targeted in V1 — REN-128's identify/reset flow is already correct. REN-164's verification (init-timing race) may surface a fix requirement here in the future, but that is explicitly a V2-gate item (see `10-roadmap/VERSION_TRIGGERS.md`), not V1 scope.

## 4. Attribution logic
No change targeted — Renivet correctly delegates attribution to Meta/PostHog platform mechanisms rather than reimplementing it. Fixing the *inputs* (REN-145) is the correct level of intervention; building a custom attribution model is explicitly out of scope (see `07-feasibility/ALTERNATIVES.md`).

## 5. Funnel semantics
No change targeted in V1. If REN-132's fix work reveals that `add_to_cart` and `cart_added` should be explicitly cross-referenced in funnel dashboards (e.g., a combined "any cart-add signal" view), that is a V2 candidate, not V1.

## 6. Reconciliation (target state)
Once REN-145 (currency+fanout) and REN-131 (server-capture) ship, re-run the same reconciliation comparison (Meta vs. PostHog raw vs. PostHog strict) for a fresh month and check whether the gap narrows. This is a validation activity (see `09-validation/EXPERIMENT_STRATEGY.md`), not a new algorithm — no target number is asserted here, consistent with the "don't fabricate ROI/economics" constraint.
