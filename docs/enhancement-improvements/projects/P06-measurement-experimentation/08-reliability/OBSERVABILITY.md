# Observability — P06

## What already exists (reuse, don't rebuild)
- `capiLogs` table — every CAPI attempt logged with `status: "success" | "failed"` and the raw response/error, regardless of outcome. This is the single best existing observability asset for validating any REN-145 fix (compare pre-fix vs. post-fix `value` fields and per-checkout event counts directly from this table).
- CAPI logs dashboard (`src/app/(protected)/dashboard/capi-logs/page.tsx`) — human-viewable surface over the above.
- PostHog itself is, definitionally, an observability tool for product events — no new observability layer is needed to see `purchase_completed`/`cart_added`/`add_to_cart` volumes.

## Gaps
- No automated alert exists for "Meta Purchase value looks anomalous" (e.g., a value 100x a plausible order size) — could be a lightweight follow-up (e.g., a sanity-check assertion in `sendCapiEvent` logging a warning if `value` exceeds a plausible order-size ceiling), but this is a nice-to-have, not required to ship the REN-145 fix itself. Flagged for consideration, not mandated.
- No dashboard currently annotates the `add_to_cart` vs `cart_added` trigger-semantics caveat (REN-132) — a documentation/observability gap, not a code gap.

## Post-fix validation approach
See `09-validation/TEST_STRATEGY.md` and `EXPERIMENT_STRATEGY.md` — validation relies on the existing `capiLogs` audit trail plus a manual multi-brand test checkout, not new tooling.
