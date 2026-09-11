# User Stories — P02

Only real, evidence-backed capabilities are phrased as committed stories. Speculative/deferred items are labeled explicitly and must not be read as committed.

## V1 stories (map to confirmed defects REN-147/150/157/160)

**US-1 (REN-147).** As a shopper (P1) with items in my cart, I want cart cross-sell suggestions to still appear — even generic or less personalized — when the personalization service is down, so that a full outage of one backend doesn't silently remove the whole feature from the page I'm looking at.
- *Acceptance sketch:* see `03-requirements/ACCEPTANCE_CRITERIA.md` AC-1.

**US-2 (REN-150).** As a returning shopper (P3) landing on the shop page, I want the "Recommended" sort to actually reflect how strongly each product matches my history, so that the products the system is most confident about appear ahead of ones it's only weakly confident about, not lumped into one undifferentiated group.
- *Acceptance sketch:* AC-2.

**US-3 (REN-157).** As any shopper (P1, P2) looking at cart cross-sell or PDP "similar products," I want the labels on these suggestions to describe what actually generated them (style/visual similarity to one item), so that I'm not led to expect a "goes well together as an outfit" or "frequently bought together" judgment the system isn't making.
- *Acceptance sketch:* AC-3.

**US-4 (REN-160).** As a shopper, I want recommendation panels to load quickly and consistently, so repeated views of the same cart/product/shop state aren't each paying full computation cost. *(This is an engineering/performance story with a shopper-visible latency benefit, not a new user-facing capability.)*
- *Acceptance sketch:* AC-4.

## V2/V3 candidate stories — NOT YET APPROVED

**US-5 (REN-165, VERIFICATION-ONLY — PROBABLE confidence, not confirmed).** As a shopper who just completed a purchase, I *might* want to see relevant follow-on product suggestions on the order-confirmation page — **this story is not validated**. It exists only to be tested/verified (see `09-validation/EXPERIMENT_STRATEGY.md`); it must not be scheduled as build work until verification produces a GO.

**US-6 (REN-168, EXPLICITLY DEFERRED — gated on demonstrated business need, "do not build speculatively").** As a shopper with multiple items in my cart, I *might* eventually want suggestions based on what other shoppers actually bought together with my items (true co-occurrence), not just visual similarity to one item — **this story is not committed, not scheduled, and gated on a demonstrated-need trigger** (see `10-roadmap/VERSION_TRIGGERS.md`). Do not treat as backlog-ready.

## Explicitly rejected story shapes (for calibration)

- ~~"As a shopper, I want an AI-powered outfit-matching engine."~~ — no such capability exists or is planned; would misstate REN-157's actual fix (copy correction, not a new engine).
- ~~"As a developer, I want to refactor the recommendation query layer."~~ — an engineering task, not a user story; belongs in `03-requirements/FUNCTIONAL_REQUIREMENTS.md` instead.
