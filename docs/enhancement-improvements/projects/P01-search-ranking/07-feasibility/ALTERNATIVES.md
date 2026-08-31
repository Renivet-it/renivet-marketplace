# Alternatives — P01

## The one real architectural question: build Renivet-owned search/ranking sync vs. keep the external dependency (REN-148's context)

### Option A — Keep depending on the external microservice as-is, add only REN-148's staged confirmation step
- **What it is:** No new infrastructure. Confirm/schedule a cadence check (manual or lightly automated) that flags when the external index might be stale relative to the live catalog, without building a reconciliation pipeline.
- **Evidence for:** The external service already works, is shared with P02, and every other issue in this Epic assumes its continued existence. No evidence of acute drift-caused customer harm exists today (UNKNOWN, because there's no measurement — but also no complaint trail found).
- **Recommendation: BUILD NOW** (this is REN-148's actual staged scope).

### Option B — Build a Renivet-owned sync/reconciliation pipeline between the live catalog and the external index
- **What it is:** A scheduled job that pushes catalog deltas to the external service, or periodically re-syncs, with monitoring for drift.
- **Evidence for:** Would fully close the drift risk REN-148 only partially addresses.
- **Evidence against:** No evidence of how the external service ingests updates (push API? re-crawl? manual?) — UNKNOWN, not investigated (would require external-vendor coordination, out of this documentation-only pass's scope). Building this without knowing the ingestion contract risks a wasted build.
- **Recommendation: DEFER.** Explicitly out of this Epic's scope per the incoming brief ("full migration explicitly NOT scoped, staged/cheap-step-only"). Revisit only if REN-148's staged step reveals measurable, recurring drift that causes customer-visible harm.

### Option C — Replace the external microservice with a Renivet-owned pgvector-based product search (activate the currently-unused `products.embeddings` columns)
- **What it is:** Use the already-populated-but-unread `products.embeddings`/`semanticSearchEmbeddings` columns to run similarity search directly in Postgres, removing the external dependency entirely.
- **Evidence for:** Would eliminate REN-146's entire risk class (no more external timeout/hang exposure) and REN-148's drift risk (single source of truth). The columns and ivfflat indexes already exist (CONFIRMED) — some of the groundwork is already there.
- **Evidence against:** No evidence embeddings are kept fresh on product *update* (only confirmed written on create/import — see `06-data/DATA_QUALITY.md`, UNKNOWN whether update-time regeneration exists). Would require replacing the RAG ranking logic itself (the actual similarity scoring/reranking Renivet doesn't currently own or understand internally — it's a black box today). This is a genuine build, not a hardening fix, and squarely out of this Epic's mandate ("keep it fast, correct, and observable," not "replace it").
- **Recommendation: REJECT for this Epic; POC-worthy as a separate, future initiative** if REN-148's staged step ever surfaces recurring drift *and* a product owner decides owning search end-to-end is worth the investment. Not a decision this documentation pass makes — flagged as **DECISION REQUIRED** for a future strategic call, not an engineering task to schedule now.

## Summary table

| Option | Recommendation | Trigger to revisit |
|---|---|---|
| A — staged confirmation only | BUILD NOW | — (this is the current plan) |
| B — full reconciliation pipeline | DEFER | Option A reveals recurring, customer-impacting drift |
| C — own the ranking end-to-end via pgvector | REJECT for now / POC-worthy later | A product owner decides search independence is strategically worth a real build, informed by data Option A/REN-154 would produce |
