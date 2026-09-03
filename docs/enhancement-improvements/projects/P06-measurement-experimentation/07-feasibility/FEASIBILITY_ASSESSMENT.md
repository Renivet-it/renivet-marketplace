# Feasibility Assessment — P06

## REN-145 (currency + fan-out) — HIGH feasibility
Both sub-fixes are localized: the currency fix is a one-line-per-call-site change (wrap `value` in `convertPaiseToRupees`, already imported/available in both files). The fan-out fix requires restructuring *when* the Purchase event fires relative to the per-brand `createOrder` loop — moderate but well-contained complexity, touching two files with near-identical structure. No new dependencies, no schema changes, no external approvals needed beyond normal code review. Estimated effort: small-to-medium engineering task, not a project.

## REN-131 (server-side capture) — MEDIUM feasibility
Requires identifying a reliable server-side trigger point (order-confirmation webhook, `linkOrderIntentToOrder` call, or a reconciliation cron). The order-creation backend already exists and is reachable; the work is wiring a `posthog-node` capture into it, which is a pattern already proven in `cart.ts`. Main risk is avoiding a NEW duplicate-counting defect if both client and server capture without a shared idempotency key — must be designed alongside REN-133's consolidation, not independently.

## REN-133 (consolidation) — HIGH feasibility
Refactor two near-identical payload-construction blocks into one shared function. Pure refactor, no behavior change beyond removing duplication. Low risk.

## REN-132 (documentation) — HIGH feasibility
No code change required in the "keep them separate" recommended path (see `05-algorithms/DECISION_LOGIC.md`) — just document the trigger semantics and add the caveat to any dashboard using both events.

## REN-134 (rename) — HIGH feasibility, LOW priority
Pure rename/file-move, mechanical, but touches every import site (`cart.ts`, `wishlist.ts`, etc.) — low risk, low urgency, appropriate for a Low-severity backlog item.

## REN-166 (GA4) — feasibility NOT assessed pending decision
Feasibility of the engineering work itself would be MEDIUM (new integration, standard `gtag` e-commerce event pattern, well-documented by Google) but assessing it further is premature — DECISION-P06-001 must resolve first. See `10-roadmap/VERSION_TRIGGERS.md`.

## REN-164 (verification) — HIGH feasibility
A focused test/investigation task (simulate rapid navigation/interaction immediately on page load, check whether early `capture()` calls are queued or dropped by `posthog-js`'s init sequence). Low effort, should be done before treating REN-129 as fully closed for high-stakes early-funnel analysis.

## AI/MCP feasibility — NOT APPLICABLE
This Epic's scope is event-instrumentation and attribution *correctness* (fixing currency units, event counts, and capture reliability in an existing pipeline) — it is not an AI/ML opportunity, and no part of the evidence base suggests one. Per `docs/enhancement-improvements/AI_GOVERNANCE.md` and `ML_AI_LIFECYCLE.md`'s guidance that AI/MCP feasibility should be assessed per-Epic rather than assumed, this Epic is explicitly assessed and found not applicable. Renivet's existing choice to delegate attribution logic to Meta/PostHog platform mechanisms (rather than building a custom model) is itself the correct simplify-not-build decision — see `BUILD_REUSE_BUY_SIMPLIFY.md` — and no MCP-based tooling is relevant to fixing a currency-unit bug or an event fan-out defect.
