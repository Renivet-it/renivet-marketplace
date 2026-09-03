# Executive Summary — P06 Measurement & Experimentation

Renivet's ad-spend and product decisions currently rest on a measurement layer with real, source-confirmed defects. This pass re-verified the prior audit's findings directly against the live codebase.

**Most urgent finding (REN-145, P0):** the Meta Purchase event sends order value in paise instead of rupees, and fires once per brand in a multi-brand cart instead of once per checkout — both confirmed by direct code inspection. The magnitude of real-world impact on historical ad spend is probable, not proven (one month of real data didn't cleanly fit expectations during quality-check) — but the defect itself is not in question.

**Four supporting fixes**, all confirmed and low-risk: no server-side capture of completed purchases (a paid order can be invisible to analytics if the customer's browser doesn't cooperate), duplicated purchase-tracking code in two files, an event-naming mixup with a low-severity file (`client.tsx` is actually server-side code), and a real — and now explained — gap between two cart-add events that dashboards have likely been misreading.

**An immediately actionable business finding, independent of any of the above:** the best-performing ad campaign in the last five months of spend data, `Remarketing_Sara`, drove 82% of all attributed purchases at nearly 5x better cost-per-acquisition than everything else — and it's currently paused. Reactivating it is a decision marketing can make today.

**One decision is needed from product**, not engineering: whether GA4 is worth wiring up as a third revenue-reporting source at all. Until that's decided, GA4 work stays off the roadmap by design, not by neglect.

Full detail, source citations, and the complete requirements/architecture/roadmap package are in the accompanying folders; see `GO_NO_GO.md` for the item-by-item verdict.
