# Business Context — P06 Measurement & Experimentation

## Why this Epic exists

Renivet spends real money on Meta ads and makes product/marketing decisions using PostHog, Meta CAPI/Pixel, and (intended) GA4 data. If the instrumentation feeding those systems is wrong, every downstream decision — campaign budget allocation, "which channel works," "which funnel step leaks" — is built on corrupted data. This Epic is about restoring trust in the measurement layer, not adding new analytics capability.

## Immediately actionable business finding: Remarketing_Sara (flag prominently — this is a business decision, not an engineering one)

Independent of any code fix, the 2026-08-23 growth audit (`docs/growth-audits/2026-08-23/`) surfaced a real, evidenced, business-actionable finding:

- Total Meta ad spend in the audited window: **₹77,615**, producing **11 Meta-attributed purchases**, a blended CPA of **₹7,057**.
- The **`Remarketing_Sara`** campaign generated **82% of all Meta-attributed purchases**, at a **4.9× better CPA** than the other campaigns running in the same window.
- `Remarketing_Sara` was **PAUSED as of the report date.**
- **100% of attributed purchases fell in the 25–34 age bracket** — a narrow, concentrated audience signal.
- **Instagram Reels consumed 33.8% of total spend with ZERO attributed purchases** in the same window.

**Business observation:** the single best-performing campaign in the data was turned off, while a zero-conversion placement (Reels) consumed a third of spend. Reactivating `Remarketing_Sara` and re-examining the Reels allocation are decisions marketing/growth can make today, independent of whether or when any engineering fix in this Epic ships. This should not be buried under the engineering findings below — it is arguably the highest-leverage, lowest-effort action available to the business right now.

This is a business observation grounded in the data as reported. It is **not** a recommendation to increase total spend, and it says nothing about CAC, LTV, or category/brand profitability — see `DATA_QUALITY.md` and the explicit prohibition on inferring economics beyond what the evidence supports.

## Why the underlying data can't yet be fully trusted

The same audit that surfaced the Remarketing_Sara finding also surfaced the reason ad-spend decisions are risky to over-index on right now: Meta's reported purchase value is built from a client-side event pipeline with a confirmed currency-unit defect and a confirmed per-brand fan-out behavior (see `01-research/RESEARCH_SUMMARY.md` and REN-145). The Remarketing_Sara *volume/CPA-ranking* finding is not affected by the value-currency defect (CPA ranking depends on purchase *count* and spend, not the corrupted value field) — that is why it can be surfaced as a confident business finding even while the value pipeline needs an engineering fix.

## Business stakeholders

- Marketing/growth: owns the Remarketing_Sara re-activation decision and the Reels spend decision.
- Engineering (Ayan Ganguly, per `MASTER_REGISTER.md`): owns REN-145, REN-131/132/133/134.
- Product: owns DECISION-P06-001 (whether GA4 is needed at all — see `docs/enhancement-improvements/07-decisions/DECISION_QUEUE.md`).
