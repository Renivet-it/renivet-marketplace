# Gate H/I/J/K — AI Model Feasibility for P08

## Existing AI stack (verified directly against current code, 2026-08-30)

Renivet has **one** AI capability today: a single self-hosted Python microservice reachable only at a hardcoded raw IP (`http://64.227.137.174:8000`), called directly from Next.js server code via `axios`/`fetch` — no env-var override in practice, no visible auth headers, no timeout, no redundancy. Three endpoints:

- `/embeddings/generate` — 384-dim, comment identifies it as "MiniLM model (legacy)."
- `/embeddings/generate-768` — 768-dim, comment identifies it as "E5-base-v2 model."
- `/search/advanced-rag` — a separate hosted RAG search endpoint used directly by product search.

Schema (`src/lib/db/schema/product.ts:179-221`, `brand.ts:89`): `products.embeddings` (384, ivfflat/cosine), `products.searchSuggestionEmbeddings` (384, ivfflat/cosine, **write-only, confirmed no read anywhere**), `products.semanticSearchEmbeddings` (768, ivfflat/cosine), `brands.embeddings` (384, no vector index).

**Correction to the prior portfolio record:** earlier passes (including P01's own SRS package) claimed `products.*embeddings` were written but never read. This is now confirmed **wrong** for two of the three columns: `products.embeddings` is read live in `getAllCatalogueProducts` (relevance-threshold filtering), and `products.semanticSearchEmbeddings` is read live in `cart.ts`'s similar-products recommendation fallback. Only `searchSuggestionEmbeddings` is genuinely write-only. `brands.embeddings` is read live in main product search for brand-intent detection (this part was already correctly documented).

**Cost:** UNKNOWN — this is a self-hosted VPS, not a metered API; no billing information exists in-repo to estimate its actual dollar cost. Do not treat "self-hosted" as "free."

**Quality/fitness for P08's identity-matching use case:** UNKNOWN and unvalidated — MiniLM/E5-base-v2 are general-purpose semantic-similarity embeddings tuned for search relevance ("close enough" is a feature there), not for identity discrimination ("close enough" is the failure mode for SKU/product matching). This is the same UNKNOWN the original P08 research already flagged; this pass confirms it's still unresolved, now with the exact model names identified.

## Gate I — P08 AI requirement decomposition

| Task | Does AI actually help? | Deterministic-first answer | Recommended tier |
|---|---|---|---|
| A. Schema/column mapping | Yes, for the residual only | Normalized-exact + alias dictionary resolves the large majority; open-vocabulary column headers ("Qty," "On Hand," "Available") are the genuinely ambiguous residual a rule table can't fully cover | Hosted LLM, structured (JSON) output, always human-confirmed regardless of confidence |
| B. Attribute normalization | Yes, for the residual only | Dedupe + lookup table resolves most; free-text variant values are the residual | **Revised by a 2026-08-30 live benchmark** (`docs/enhancement-improvements/projects/P08-brand-data-integration/07-feasibility/EMBEDDING_BENCHMARK.md`): reuse the existing MiniLM-384 embedding service for candidate ranking (measured 100% top-1/top-3, zero false positives, zero marginal cost) — fall back to a hosted LLM only below a to-be-validated confidence margin. Hosted LLM remains the primary path for task A (schema mapping), where the same benchmark found embeddings measurably underperform deterministic matching. |
| C. SKU candidate matching | Only for ranking/suggestion, never for the write itself | Exact match (sku/barcode/normalized-title+attributes) resolves the confident cases | Deterministic waterfall first; embedding-based ranking DEFERRED until the existing embedding model's identity-matching fitness is validated (see below) — queue-only, never auto-apply, per the already-corrected guardrail |
| D. Anomaly explanation | Yes, narration only, after a deterministic detector fires | A rule/statistical detector must fire first; AI never detects | Hosted LLM, low frequency (only when already flagged) |
| E. Error explanation | Yes, narration only | Same shape as D | Hosted LLM, low frequency |

No task in this decomposition requires a generative model to make a final, unreviewed decision. All five are either narrow classification-shaped (A/B) or pure narration after a deterministic gate (D/E), or explicitly excluded from AI authority entirely (C's actual write path).

## Gate J — AI architecture options, compared

| Option | Quality (for A/B/D/E) | Latency | Ops burden | Cost shape | Verdict |
|---|---|---|---|---|---|
| A. Deterministic only | Adequate for majority; misses open-vocabulary residual | N/A | None | Zero | Viable as a leaner V1, see Gate 19 below |
| B. Deterministic + existing Renivet embeddings | Poor fit — reuses a fragile, unauthenticated, single-VPS dependency (the same one P01's REN-146 is currently hardening) with unvalidated identity-matching fitness | Inherits that service's current no-timeout risk | Couples P08 to infrastructure someone else is actively stabilizing | Zero marginal $, but real coupling/reliability risk | **REJECT for V1** — do not add a new consumer to an unhardened shared dependency |
| C. Deterministic + small local LLM (self-hosted) | Good, if the right model is chosen | Low (in-process or same-VPC) | High — requires someone to operate model serving; no evidence Renivet has this capability today (already established: "no dedicated ML engineer needed" in the P08 SRS's own resource assessment) | New fixed infra cost regardless of volume | **DEFER** — ops burden doesn't match Renivet's current team shape |
| D. Deterministic + self-hosted inference service (dedicated, larger) | Good | Low | Higher still | Higher fixed cost | **REJECT for V1** — same reasoning as C, worse |
| E. Deterministic + hosted LLM fallback (a managed API) | Good — general-purpose instruction models handle structured classification/mapping tasks well | Acceptable (hundreds of ms–few seconds, non-customer-facing path) | Low — no new service to run, monitor, or scale | Pay-per-call, and call volume is deduplicated (see Gate 20) so total spend stays low regardless of brand count | **RECOMMENDED for V1** |
| F. Fine-tuned model | Best quality ceiling, if enough labeled data existed | Depends on hosting | High | High, and unjustified without real match/mapping volume data (which doesn't exist — Gate G confirms zero real corpora even exist yet) | **REJECT** — no data volume or evidence justifies this |

## Gate K — model selection

Given Option E is recommended, the "small local model" candidates (Qwen3 small variants, Llama 3.2 small variants) are **not the leading choice for V1** — they solve a problem (low-latency, no-network-hop inference) that P08's actual workload doesn't have, since none of tasks A/B/D/E sit on a customer-facing request path and none require sub-100ms latency. **If Phase 2 volume ever grows enough to justify self-hosting** (a real, evidence-gated trigger, not a default), a small instruction-tuned model in the Qwen2.5/3 (0.5B–3B class) or Llama 3.2 (1B–3B class) range would be the right shape for structured-output classification tasks like A/B — chosen then, against real volume/cost data, not now.

## Final recommendation

**HOSTED FALLBACK (Option E)** for tasks A, D, E. **Task B revised** by the 2026-08-30 live benchmark to REUSE the existing MiniLM-384 embedding (Option B) as the primary candidate-ranking signal, falling back to a hosted LLM only below a validated confidence margin — see `docs/enhancement-improvements/projects/P08-brand-data-integration/07-feasibility/FINAL_AI_DECISION.md` for the full evidence. **DEFER** any AI involvement in task C beyond deterministic exact-match, pending the same preconditions the original P08 research already named (real match data, provenance, `brand_external_identifiers` pin-once) — reinforced, not newly established, by the same benchmark finding that the existing E5-base-v2 embedding is poorly calibrated on a related mapping task (false positives on 100% of genuinely-unresolved test cases).
