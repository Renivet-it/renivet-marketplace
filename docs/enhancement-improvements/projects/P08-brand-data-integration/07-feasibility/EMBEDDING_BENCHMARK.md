# Embedding Benchmark — Real Results

All numbers below come from an actual disposable benchmark run against the golden dataset (`GOLDEN_DATASET.md`), executed 2026-08-30. Deterministic baseline: local Python script, no external calls. Embedding baselines: real, live HTTP calls to Renivet's existing embedding service (`http://64.227.137.174:8000`), measured with real latency. Nothing here is estimated or invented.

## Baseline 0 — Deterministic (exact + normalized + alias match)

| Task | Accuracy (incl. correctly-UNRESOLVED) | Unresolved rate |
|---|---|---|
| Schema mapping (13 examples) | **92.3%** (12/13) | 23.1% (3/13 — 2 correctly unresolved, 1 genuine miss: "Sellable Quantity" wasn't in the alias list) |
| Attribute normalization (8 examples) | **87.5%** (7/8) | 25.0% (2/8 — 1 correctly unresolved, 1 genuine miss: "Jet Black" wasn't in the alias list) |

**Takeaway:** a modestly-built alias dictionary already resolves the large majority of both tasks. The genuine misses (Sellable Quantity, Jet Black) are exactly the kind of open-vocabulary residual a deterministic-only system will always have a tail of — this is the residual AI assistance should target, not the majority case.

## Baseline 1 — Existing embeddings (live calls to MiniLM-384 and E5-base-v2-768)

| Model | Task | Top-1 accuracy | Top-3 recall | False positives on UNRESOLVED (score>0.75) | Mean latency |
|---|---|---|---|---|---|
| MiniLM-384 | Schema mapping | 63.6% (7/11) | **90.9%** (10/11) | 0/2 | 118ms |
| E5-base-v2-768 | Schema mapping | 72.7% (8/11) | 72.7% (8/11) | **2/2** | 238ms |
| MiniLM-384 | Attribute normalization | **100%** (7/7) | 100% (7/7) | 0/1 | 103ms |
| E5-base-v2-768 | Attribute normalization | **100%** (7/7) | 100% (7/7) | 1/1 | 256ms |

## Real, important findings from this run

1. **Neither embedding model beats the deterministic baseline on schema mapping.** MiniLM's 63.6% and E5's 72.7% top-1 are both below deterministic's 92.3%. MiniLM's 90.9% top-3 recall shows embeddings can still help as a *candidate list* for schema mapping, but not as the primary resolver.
2. **E5-base-v2's raw cosine scores are poorly calibrated for this task — a real, measured problem, not a theoretical one.** Its scores cluster uniformly high (0.75–0.98) regardless of whether the match is correct, meaning both genuinely-unresolved test items ("Warehouse Location," "Season Code") scored above the naive 0.75 confidence threshold — a real false-positive rate of 100% on the unresolved cases in this test. **A system using E5's absolute cosine score as a confidence gate for auto-suggesting or auto-applying a mapping would have confidently suggested a wrong field for both unresolved cases.** This is direct, measured evidence supporting the portfolio's already-established caution about trusting embedding-model confidence scores for identity/mapping decisions (`AI_CRITIQUE.md`'s Tier-2 finding) — this benchmark independently reproduces the same failure shape in a different task.
3. **Attribute normalization is where the existing embeddings genuinely earn their keep.** Both models hit 100% top-1/top-3 with no false positives on the one unresolved case (MiniLM) or one false positive (E5) — a materially different, better-suited task shape than schema mapping. Short, single-concept strings (color/size synonyms) are exactly what these general-purpose semantic-similarity models are tuned for; multi-word column-header phrases with more varied structure are not.
4. **Latency is not a blocker for either model** (103–256ms mean) for a non-customer-facing, async brand-onboarding flow.

## Implication for P08's AI architecture (feeds `MODEL_COMPARISON.md`/`FINAL_AI_DECISION.md`)

- **Attribute normalization (task B):** the existing MiniLM-384 embedding service is a credible, already-available candidate-ranking signal — REUSE FOR CANDIDATE GENERATION ONLY (never auto-apply without human confirmation, per existing guardrails), rather than defaulting straight to a hosted LLM call for every unresolved value.
- **Schema mapping (task A):** the existing embeddings underperform and mis-calibrate — a hosted LLM (given the column name plus a few real sample values as context) is the better-evidenced choice for the genuinely ambiguous residual, not the existing embedding service.
- **SKU candidate matching (task C):** not directly tested (no realistic product-title corpus exists, per `GOLDEN_DATASET.md`), but E5's calibration failure here is a directly relevant warning: if the same model were used for SKU/identity candidate ranking, its uniformly-high absolute scores would need a *relative margin* (top1-vs-top2 gap), not an absolute threshold, to be trustworthy — reinforcing, with new evidence, why the original research's decision to keep SKU-matching auto-apply deferred until real match data exists remains correct.
