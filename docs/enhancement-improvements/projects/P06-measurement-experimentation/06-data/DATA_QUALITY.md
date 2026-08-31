# Data Quality — P06

## The 11 / 15 / 2 / 0 purchase-count discrepancy

Per the governing evidence for this Epic, over the same reporting period:

| Source | Count | What it measures | Caveat |
|---|---|---|---|
| Meta (attributed) | 11 | Purchases Meta's ad platform credits to its campaigns | Currently computed from Purchase events affected by REN-145 (currency unit + per-brand fan-out); PROBABLE (not CONFIRMED) that this materially distorts the count/value relationship in a given period |
| PostHog raw | 15 | All-channel `purchase_completed` captures, unfiltered | Higher than Meta partly because PostHog has no attribution-window/match-quality filtering and captures every fan-out event; not itself defective, but not directly comparable to Meta's number without accounting for REN-145's fan-out on the Meta side |
| PostHog strict | 2 | Same events, filtered to a stricter definition | **MEASUREMENT ARTIFACT** — do not read as "only 2 real purchases happened." The strict filter is removing far more than it should relative to actual purchase volume; the number describes the filter, not the business |
| GA4 | 0 | GA4-reported purchases | **NOT because zero purchases occurred** — GA4 e-commerce events are not wired up at all (REN-166, CONFIRMED). Session data in the same GA4 export is non-zero, proving the GA4 tag itself fires; only the e-commerce event layer is missing |

**Explicit instruction preserved from governing evidence**: do not compute or imply CAC, LTV, retention, or profitability from any of these four numbers. Do not treat "2" as ground truth. Do not treat "0" as evidence of zero purchases. The correct summary is: **all four numbers are currently untrustworthy as an absolute purchase count, for four different and independently-diagnosed reasons**, not as four independent confirmations of a range.

## Reconciliation status

WHY they differ is explained mechanistically in `05-algorithms/DECISION_LOGIC.md` and `CURRENT_ALGORITHM.md` (client-only vs. server-side capture, strict-mode filtering, unwired GA4 events). No numeric reconciliation ("the true count is X") is asserted — the evidence base does not support one, and fabricating one would violate the program's evidence-discipline constraint.

## Data quality risks introduced/perpetuated by not fixing REN-131/132/133/134/145

- Silent, ongoing corruption of Meta-reported conversion value (REN-145) — the most dangerous class of defect because it produces no error, crash, or visible symptom; the numbers simply look plausible and wrong.
- Continued inability to trust `add_to_cart` vs `cart_added` ratio for funnel-drop-off analysis without the documented caveat in `DECISION_LOGIC.md`.
- Continued invisibility of purchases where the client fails post-payment (REN-131) — an undercount with no error signal.
