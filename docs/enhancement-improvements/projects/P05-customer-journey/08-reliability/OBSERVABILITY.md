# Observability — P05 Customer Journey & UX

## Current state (CONFIRMED)
The checkout flow is heavily `console.log`/`console.error` instrumented (numbered "STEP" markers throughout `orders.ts`'s `createOrder` mutation, and extensive logging in `src/lib/razorpay/payment.ts`'s handler). This is developer-debugging-oriented logging, not structured observability — there is no evidence in the code read of these logs feeding a queryable metrics/alerting system (e.g., no visible integration with a logging/APM platform in the files opened). This is UNKNOWN beyond the code itself — a logging/APM platform could exist at infrastructure level and simply not be visible from application code.

## Gap directly relevant to REN-144
There is no evidence of an alert or dashboard on the specific condition that matters most: `createdOrders.length < brandCount` (or, more precisely, fewer order rows created than line items paid for). This is the single most actionable observability gap in this Epic — even before FR-1.2's transactional fix ships, adding an alert on this exact condition would convert REN-144 from "customer discovers it, then support escalates" to "operator is paged immediately," which is a meaningful interim mitigation.

## Recommendation
1. Add structured logging (not just `console.log`) at minimum for the reconciliation-record state transitions proposed in FR-1.3, so the record's lifecycle is queryable.
2. Add an alert on any occurrence of partial order creation, deployable independently of and before the full transactional fix — this is a monitoring-only change with no risk to existing behavior and should not wait on REN-144's full remediation.
3. Any dashboard/alerting work should coordinate with P06 (Measurement & Experimentation) since both consume the same checkout/payment event stream (`DEPENDENCY_GRAPH.md` P05→P06 edge).
