# Model Comparison — Real Benchmark Results

All embedding numbers are from actual runs against `GOLDEN_DATASET.md` (2026-08-30) — deterministic and existing-service numbers via live calls, Qwen3-Embedding-0.6B via an actual local model load and inference run in a disposable venv (not committed to the repo, not a production dependency).

## Head-to-head accuracy

| Option | Schema mapping top-1 | Schema mapping top-3 | Attribute norm top-1 | Attribute norm top-3 | False positives (both tasks combined, score>0.75) |
|---|---|---|---|---|---|
| Deterministic only | **92.3%** | N/A (single prediction) | **87.5%** | N/A | N/A |
| MiniLM-384 (existing) | 63.6% | 90.9% | 100% | 100% | 0/3 |
| E5-base-v2-768 (existing) | 72.7% | 72.7% | 100% | 100% | **3/3** |
| Qwen3-Embedding-0.6B (candidate) | **90.9%** | 100% | 85.7% | 100% | **0/3** |

## What this means, read carefully

- **Deterministic alone is already the strongest single option for schema mapping** (92.3%, no embedding model beat it on top-1 except Qwen3, which came close at 90.9%).
- **Qwen3-Embedding-0.6B is the best-calibrated embedding option tested** — zero false positives across both tasks, materially better schema-mapping accuracy than either existing model, and 100% top-3 recall on both tasks. Its one weakness in this run: attribute normalization top-1 (85.7%, missed "XL"→"Extra Large" specifically, ranking "Black" higher) — a real, measured error, not a hypothetical one.
- **E5-base-v2 (already in production for P01/P02 search) has a real calibration problem**, confirmed by this benchmark: it produced false positives on 100% of the genuinely-unresolved test cases across both tasks. This is new, measured evidence — not merely the theoretical "unvalidated fitness" concern the original P08 research flagged.
- **MiniLM-384 is excellent for attribute normalization specifically** (100%, well-calibrated) but weak for schema mapping (63.6%, well below deterministic).

## Candidate model requirements (Gate 7)

| Property | Qwen3-Embedding-0.6B | Existing MiniLM-384 | Existing E5-base-v2-768 |
|---|---|---|---|
| Parameters | 0.6B | Unknown (not disclosed by the service; "legacy" per code comment) | Unknown (not disclosed by the service) |
| Measured model load (cold start) | **65.3s**, real measurement, CPU-only, this machine | N/A — already running as a persistent service | N/A — already running as a persistent service |
| Measured inference latency (warm, in-process) | **~100-120ms per text** | 103-118ms (network round-trip to existing service) | 238-256ms (network round-trip) |
| GPU required? | **No — ran CPU-only on this benchmark, successfully** | No (already CPU-hosted per existing service) | No (already CPU-hosted) |
| RAM | Not separately measured this pass; ESTIMATED low-single-digit-GB for a 0.6B model in default precision, consistent with successful load on this machine without special memory tuning | UNKNOWN (existing service, not measured) | UNKNOWN |
| Disk / model storage | **1.2GB, measured directly** (`du -sh` on the actual downloaded HuggingFace cache) | N/A | N/A |
| Structured output support | Not applicable — this is an embedding model, not generative; structured output is a generative-LLM concern (relevant only if a generative model is later added for schema-mapping residual, per `AI_USE_CASE_ANALYSIS.md`) | N/A | N/A |
| Licensing | Apache 2.0 (Qwen3 model family, per public model card) | Unknown — not disclosed by the internal service | Unknown |
| Local/self-hosted suitability | **Confirmed feasible on ordinary CPU hardware**, based on this actual run | Already self-hosted (existing service) | Already self-hosted (existing service) |

## Verdict from this comparison

Qwen3-Embedding-0.6B is a **credible, better-calibrated alternative to E5-base-v2 specifically**, evidenced by a real run, not a spec sheet. But per `FINAL_AI_DECISION.md`, credible-and-better is not the same as justified-for-V1 — see the decision rule (simplest option that meets requirements) applied there.
