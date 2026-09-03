# Audit to Epic Traceability — P06

| Audit source | Finding | Epic item |
|---|---|---|
| `ecommerce-intelligence` audit (prior pass) | PostHog identity linking missing | REN-128 (shipped) |
| `ecommerce-intelligence` audit | Delayed PostHog init | REN-129 (shipped) |
| `ecommerce-intelligence` audit | phone-first-sign-up missing tracking | REN-130 (shipped) |
| `ecommerce-intelligence` audit | No server-side purchase capture | REN-131 |
| `ecommerce-intelligence` audit | add_to_cart/cart_added discrepancy | REN-132 |
| `ecommerce-intelligence` audit | Duplicate purchase instrumentation | REN-133 |
| `ecommerce-intelligence` audit | Misnamed PostHog client file | REN-134 |
| `qa-finding` (cross-cutting) | Meta Purchase currency + fan-out defect | REN-145 |
| `qa-finding` (cross-cutting, shared with P01) | Search click/result-count no-op stub | REN-154 |
| `qa-finding` (cross-cutting) | Extend product-click tracking | REN-162 |
| `qa-finding` (cross-cutting) | PostHog init-timing race, unverified | REN-164 |
| `qa-finding` (cross-cutting) | GA4 e-commerce events not wired up | REN-166 |
| `docs/growth-audits/2026-08-23/` (independent data pull) | GA4 e-commerce columns all zero | Corroborates REN-166 |
| `docs/growth-audits/2026-08-23/` | Remarketing_Sara 82%/4.9x CPA, paused | BR-6 (business observation, no Linear issue — a marketing action item, not an engineering one) |

See `docs/enhancement-improvements/AUDIT_TO_BACKLOG_TRACEABILITY.md` for the full program-wide version of this mapping; this table is the P06-scoped excerpt, not a duplicate of the whole document.
