# Personas — P06

This Epic is instrumentation-shaped, not customer-capability-shaped: the "customer" experience does not change. The relevant personas are internal consumers of the data this Epic makes trustworthy.

## Marketing Operator

Runs Meta ad campaigns, allocates budget by campaign/CPA, and is currently the primary consumer of both the Remarketing_Sara finding and the risk that REN-145 poses to their reported numbers. Needs: order value reported in rupees; one conversion per order; confidence that a reported CPA reflects real spend efficiency, not a currency-unit artifact.

## Growth/Product Analyst

Uses PostHog funnels (`product_viewed` → `add_to_cart` → `checkout_started` → `purchase_completed`) to find drop-off. Needs: event trigger semantics that are documented and consistent, so a funnel ratio reflects real behavior, not an artifact of one event being client-gated and another server-unconditional (REN-132).

## Engineer extending analytics instrumentation

Adds new PostHog/Meta events to new features. Needs: a correctly-named, single-purpose server client (REN-134) and a single, non-duplicated purchase-completion capture path to extend (REN-131/133) rather than two near-identical ones.

## End customer (Renivet shopper) — not directly affected

No customer-facing behavior changes as a result of this Epic. Customers are the subject of the measurement, not a beneficiary or user of it in the traditional sense — noted for completeness per the template, not because this Epic changes their experience.
