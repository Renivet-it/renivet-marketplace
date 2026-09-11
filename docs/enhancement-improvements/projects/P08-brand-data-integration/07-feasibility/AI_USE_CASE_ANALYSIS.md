# AI Use Case Analysis — P08

Refined using this pass's actual benchmark evidence (`EMBEDDING_BENCHMARK.md`), not just theoretical reasoning.

| Task | Deterministic sufficient? | Alias/lookup sufficient? | String similarity sufficient? | Embedding similarity sufficient? | Classifier needed? | Generative LLM needed? | Human review required? |
|---|---|---|---|---|---|---|---|
| **A. Schema/column mapping** | For the majority (92.3% measured) | Yes, for majority | Partial | **No — measured underperformance vs. deterministic, and poor calibration (E5)** | Not evidenced as better than the alternatives below | **Yes, for the residual only** — a short structured-output call with the column name + a few real sample values as context | **Always**, regardless of confidence (unchanged policy) |
| **B. Attribute normalization** | For the majority (87.5% measured) | Yes, for majority | Partial | **Yes — measured 100% top-1/top-3 with existing MiniLM-384** | Not needed, embeddings already sufficient | Only if embeddings + lookup table both fail (rare, given measured performance) | Yes for the residual (unchanged policy); embedding-suggested matches still shown to a human before the per-brand lookup table is updated |
| **C. SKU candidate matching** | For exact matches only | Yes, for exact matches | Yes, for the deterministic waterfall's fuzzy-but-unique step | **Untested directly; E5's calibration failure elsewhere is a direct warning against trusting absolute similarity scores here** | Not evidenced | Not needed for ranking; never for the write | **Always** — this is the hard guardrail boundary, unchanged and reinforced by this pass's calibration finding |
| **D. Anomaly explanation** | Detection stays deterministic/statistical | N/A | N/A | N/A | N/A | **Yes, but narration-only, after a deterministic detector already fired** | No — low blast radius, pure explanation of an already-made decision |
| **E. Import/error explanation** | N/A | N/A | N/A | N/A | N/A | **Yes, same shape as D** | No |

## What changed from the prior (pre-benchmark) portfolio position

The original P08 research and the earlier execution-readiness pass recommended a **hosted LLM fallback for both schema mapping and attribute normalization** (Option E, applied uniformly). This benchmark **refines that**, not overturns it: attribute normalization should **reuse the existing MiniLM-384 embedding service for candidate ranking** (measured 100% accuracy, materially cheaper than a hosted LLM call, and the service already exists) rather than defaulting to a hosted LLM call for every unresolved attribute value. Schema mapping's recommendation is **unchanged** — hosted LLM for the residual, because embeddings measurably underperform there.

## Hard boundary, unchanged and reinforced

AI (embedding or generative) never becomes authoritative for SKU identity, inventory, price, tax, warehouse, or financial/order state. This benchmark did not find any evidence that would justify loosening this boundary — if anything, E5's measured false-positive behavior on ambiguous cases is direct evidence for keeping it exactly where it is.
