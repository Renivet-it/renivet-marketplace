# AI Cost Model — P08

Refines the prior execution-readiness pass's cost model (`docs/enhancement-improvements/execution-readiness/10-AI_COST_MODEL.md`) with this pass's benchmark evidence. Same discipline: KNOWN / ESTIMATED / UNKNOWN, no invented precision.

## Recommended architecture's cost components

| Component | One-time | Recurring | Basis |
|---|---|---|---|
| Attribute normalization (existing MiniLM-384, reused) | $0 — no new integration needed, already callable | $0 marginal — reuses existing infrastructure, no new API contract | KNOWN: this pass confirmed the endpoint works and is already live |
| Schema mapping residual (hosted LLM) | Low, ESTIMATED — standard API-integration engineering | ESTIMATED low, exact figure UNKNOWN pending real call volume | Bounded by dedup discipline (once per unique column per brand) |
| Anomaly/error explanation (hosted LLM) | Low, ESTIMATED | ESTIMATED low | Bounded by "only when a detector already fired" |

## Illustrative scenario (explicitly labeled as an assumption exercise, not a forecast)

**Assumptions (stated, not derived from real data — Gate G confirmed no real brand-tier data exists):** 10 brands onboarding in a given month, 1,000 unique schema-mapping decisions/month across them (100/brand — plausible for a messy spreadsheet-only brand with many columns needing one-time mapping), 10,000 unresolved attribute values/month (1,000/brand — plausible for large, inconsistent variant catalogs).

| Task | Calls/month (with dedup) | Cost driver |
|---|---|---|
| Schema mapping (hosted LLM, residual only — assume ~20% of 1,000 aren't resolved deterministically, per this benchmark's ~92% deterministic accuracy leaving an ~8% gap, rounded up for a conservative margin) | ~200 calls/month | ESTIMATED low — a few dollars/month order of magnitude for a short structured-output call at typical hosted-LLM pricing, not independently priced against a specific provider in this pass |
| Attribute normalization (existing MiniLM, all 10,000 — no per-call cost since it reuses existing infra) | 10,000 calls/month | $0 marginal, since this pass confirmed the existing service handles ~100-120ms/call and no metering/billing applies (self-hosted VPS, sunk cost) |

**This scenario is illustrative only** — real volume depends entirely on the still-UNKNOWN brand-tier distribution (the same UNKNOWN blocking Phase 2 decisions across the whole P08 program). The point of this exercise is to show the cost *shape* (small, dedup-bounded, dominated by a fixed low-volume hosted-LLM cost rather than scaling with catalog size), not to forecast an actual dollar figure.

## What did NOT change from the prior cost model

No new infrastructure cost (Gate L/17 already established this; this pass's Qwen3 test confirms self-hosting *would* be feasible on CPU but doesn't change the recommendation to avoid it for V1 — see `FINAL_AI_DECISION.md`). Storage, network, and monitoring costs remain negligible, as previously established.
