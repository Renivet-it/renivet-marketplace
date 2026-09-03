# Final AI Decision — P08

Synthesizes `AI_CURRENT_STACK.md`, `AI_USE_CASE_ANALYSIS.md`, `GOLDEN_DATASET.md`, `MODEL_COMPARISON.md`, `EMBEDDING_BENCHMARK.md`, `INFRASTRUCTURE_BENCHMARK.md`, `AI_COST_MODEL.md`, `AI_SECURITY_REVIEW.md`, and `AI_MLOPS_REQUIREMENTS.md` into one decision.

## Gate 13 — Decision rule applied

*The preferred architecture is the simplest option that meets quality, safety, latency, cost, and operational requirements — not the most sophisticated one.* Applied per task:

- **Schema mapping:** deterministic rules solve 92.3% (measured). The residual needs something better than the existing embeddings (both measured below deterministic on this task) — a hosted LLM call is the simplest option that materially improves the residual without new infrastructure.
- **Attribute normalization:** deterministic rules solve 87.5% (measured). The existing MiniLM-384 embedding measurably improves the residual (100% top-1 in this test) — **reuse, don't add a new dependency.**
- **SKU candidate matching:** deterministic exact-match is the only thing authorized to write. Embedding-based ranking stays queue-only, unauthorized to write, per the unchanged hard boundary — reinforced, not loosened, by this pass's calibration findings.
- **Anomaly/error explanation:** a bounded, low-frequency hosted-LLM narration call, only after a deterministic detector fires — no change from the prior recommendation.

## Gate 14 — Existing model reuse decision

| Model | Decision | Why |
|---|---|---|
| **MiniLM-384** | **REUSE FOR CANDIDATE GENERATION ONLY** (attribute normalization) | Measured 100% top-1/top-3, well-calibrated (0 false positives), already live, zero marginal cost. NOT for schema mapping (measured 63.6%, below deterministic) and NOT for any auto-apply write (unchanged guardrail). |
| **E5-base-v2-768** | **NOT SUITABLE**, for either P08 task, as tested | Measured worse than deterministic on schema mapping (72.7% vs 92.3%) and produced false positives on 100% of the genuinely-unresolved test cases across both tasks — a real, measured calibration failure, not a theoretical concern. Its existing production role in P01/P02 search is unaffected by this finding (different task, different requirements) — this is specifically about NOT extending it to P08. |

**We are not reusing the existing service merely because it exists** — MiniLM is reused because it measurably earns its place on one specific task; E5 is explicitly rejected for P08 despite already existing, because it measurably underperforms on the tasks P08 actually needs.

## Gate 15 — New model decision

**NO — Qwen3-Embedding-0.6B is not recommended for V1, despite testing as the best-calibrated embedding option (0 false positives, 90.9% schema-mapping top-1).**

Why not, given it tested better than both existing models: self-hosting it — even though this pass proved it's technically feasible on CPU, no GPU required — is a **new operational commitment** (a service to run, monitor, restart, and capacity-plan) that Renivet has no evidenced ML-ops capacity to take on (established across multiple prior passes: no dedicated ML engineer exists). The simplest-sufficient-option rule (Gate 13) means "measurably better" is not the same as "justified" when a zero-new-infrastructure alternative (reuse MiniLM for attribute norm, hosted LLM for the schema-mapping residual) already meets the requirements. **This is not a permanent rejection** — if Phase 2 volume or a demonstrated E5/MiniLM shortfall in production ever justifies revisiting, Qwen3-Embedding-0.6B is now a benchmarked, evidenced candidate, not a cold start.

## Gate 16 — Recommended flow

```
SOURCE (brand file upload)
  → deterministic rules (alias dictionary, normalized-exact match)
      — resolves ~92% of schema mapping, ~87% of attribute values (measured)
  → saved/pinned mappings (once confirmed per brand, never re-guessed)
  → similarity / candidate ranking
      — schema mapping: NONE (existing embeddings measurably underperform here — go straight to LLM for the residual)
      — attribute normalization: EXISTING MiniLM-384 (measured 100% top-1, reused as-is)
  → optional small model
      — schema mapping residual only: a hosted LLM call, given the column name + a few real sample values
      — NOT a new self-hosted model (Gate 15)
  → confidence
      — attribute normalization: MiniLM similarity score, human-reviewed before the per-brand lookup table updates
      — schema mapping: hosted LLM suggestion, always human-confirmed regardless of confidence (unchanged policy)
  → policy (hard boundary, unchanged): SKU identity, inventory, price, tax, warehouse, financial/order state never auto-write from any AI signal
  → human review (always, for anything not deterministically exact)
  → apply
```

**Where AI exists:** attribute-normalization candidate ranking (existing MiniLM-384, reused) and schema-mapping residual suggestion (new hosted LLM call, bounded and deduplicated). **Where it does not exist:** SKU/identity resolution's actual write path (deterministic exact-match only), inventory/price/tax/warehouse/financial state (never AI-authoritative, anywhere).

## Gate 17 — Optional hosted fallback, quantified

- **Exactly what calls are made:** one structured-output request per unresolved schema-mapping column, containing the column name and a small number of real sample values from that column.
- **When they happen:** only after the deterministic layer fails to resolve a column, and only once per unique column per brand (cached thereafter).
- **Maximum calls per import:** bounded by the number of distinct unmapped columns in that file — typically small (a handful, not hundreds), since most files have a bounded number of columns regardless of row count.
- **Maximum calls per brand:** bounded by the number of distinct columns that brand's export format ever introduces — effectively a one-time cost per brand's format, not a recurring per-import cost, once mappings are pinned.
- **Deduplication:** mandatory, per-brand-per-column, matching `10-AI_COST_MODEL.md` (execution-readiness) and this document's illustrative scenario.
- **Timeout:** required, learning directly from REN-146's lesson (the existing embedding service's absence of a timeout is a known, currently-being-fixed defect) — do not repeat that mistake on the new hosted-LLM call.
- **Fallback:** on failure or timeout, the column falls through to "unresolved, needs manual mapping" — the import is never blocked waiting on the AI call.
- **Monthly cost estimate:** ESTIMATED low, per the illustrative scenario in `AI_COST_MODEL.md` — order of magnitude a few dollars/month at the assumed volume, not independently priced against a specific provider.
- **Cost ceiling:** the dedup discipline itself is the ceiling mechanism — cost cannot scale with catalog size, only with the number of distinct column-naming conventions Renivet's brand population actually uses, which is bounded by definition (there are only so many ways to name "quantity").
- **Hosted inference is never a mandatory dependency for a successful import** — the deterministic + saved-mapping + manual-review path always exists as the guaranteed fallback path, matching the zero-infrastructure option already established in the execution-readiness pass.

## Gate 20 — Final decision matrix

| Option | Quality (measured) | Latency (measured) | RAM | VRAM | CPU | GPU | Cost | Complexity | Security | Decision |
|---|---|---|---|---|---|---|---|---|---|---|
| Deterministic | 92.3% schema / 87.5% attribute | N/A (no network call) | Negligible | N/A | Negligible | N/A | $0 | Lowest | No data leaves Renivet | **BUILD — the foundation layer for both tasks** |
| Existing MiniLM-384 | 63.6% schema / **100% attribute** | 103-118ms | UNKNOWN (existing service) | N/A | UNKNOWN (existing service) | N/A (CPU-hosted) | $0 marginal | Low — already integrated | Unauthenticated service, structural metadata only | **REUSE — attribute normalization only** |
| Existing E5-base-v2-768 | 72.7% schema / 100% attribute, but **3/3 false positives** | 238-256ms | UNKNOWN | N/A | UNKNOWN | N/A (CPU-hosted) | $0 marginal | Same as MiniLM | Poorly calibrated for this use — **NOT SUITABLE** |
| Qwen3-Embedding-0.6B | **90.9% schema**, 85.7% attribute, **0/3 false positives** | ~100-120ms (measured, CPU) | Not separately profiled; loaded successfully without special tuning | Not required (CPU-only run) | Ran successfully, ordinary CPU | Not required | New: 1.2GB storage + a service to run | New operational commitment | Self-hosted, no new external data exposure | **DEFER — best-calibrated candidate, not justified for V1 given no ML-ops capacity** |
| Small local generative model | Not benchmarked (out of scope — no generative task required at V1, per `AI_USE_CASE_ANALYSIS.md`) | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | **NOT NEEDED for V1** |
| Hosted API fallback (generative) | Not independently benchmarked in this pass (no specific provider tested); expected strong on structured short-form classification per general LLM capability | ESTIMATED hundreds of ms to a few seconds | N/A (no local resource) | N/A | N/A | N/A | ESTIMATED low, dedup-bounded | Low — standard API integration | Data leaves Renivet by design; needs a no-training-on-data provider policy | **BUILD — schema-mapping residual only, tightly bounded** |
