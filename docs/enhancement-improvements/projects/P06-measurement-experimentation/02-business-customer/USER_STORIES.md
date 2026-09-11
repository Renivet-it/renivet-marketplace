# User Stories — P06

This Epic is genuinely thin on user stories — most of the work is engineering-instrumentation-shaped ("fix the event," "stop double-firing"), not user-capability-shaped. The evidence does not support manufacturing more stories than are defensible. The following are the stories the evidence actually supports; each maps to specific requirements/issues.

1. **As a marketing operator**, I want ad-spend attribution to reflect actual order value, so budget decisions aren't based on 100x-inflated conversion values. (REN-145 currency defect → BR-1)
2. **As a marketing operator**, I want one Meta conversion event per completed order, so campaign-level purchase counts and CPA aren't inflated by how many brands happened to be in a customer's cart. (REN-145 fan-out → BR-2)
3. **As a growth analyst**, I want purchase completion captured even when a customer's browser doesn't survive to fire a client-side event, so my funnel isn't systematically undercounting real orders. (REN-131 → BR-3)
4. **As a growth analyst**, I want `add_to_cart` and `cart_added` to have documented, distinct trigger definitions, so I know whether a gap between them reflects real user drop-off or just differing instrumentation surfaces. (REN-132 → BR-4)
5. **As an engineer extending analytics code**, I want the PostHog client file names to say which runtime they execute in, so I don't accidentally import a server-side client into browser code or vice versa. (REN-134 → BR-5)

No story is manufactured for REN-166 (GA4) because it is explicitly deferred pending a product decision, not an engineering-readiness item — see `03-requirements/ACCEPTANCE_CRITERIA.md` and `07-decisions/DECISION_QUEUE.md` (DECISION-P06-001).
