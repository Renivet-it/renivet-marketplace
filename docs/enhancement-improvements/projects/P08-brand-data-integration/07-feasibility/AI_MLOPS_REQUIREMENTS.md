# AI MLOps Requirements — P08 V1 (minimum governance only, not a platform)

Per instruction: define only what will be required, do not build it now.

| Requirement | What's needed for P08 V1 |
|---|---|
| Model version | Log which embedding model (MiniLM-384, for attribute normalization) or which hosted LLM + model version (for schema-mapping residual) produced each suggestion |
| Prompt version | For the hosted-LLM calls, version the prompt template used — a prompt change should be tracked like a code change |
| Input/output logging policy | Log the input (column name / attribute value) and the suggestion produced, scoped to exclude any customer/financial data (per `AI_SECURITY_REVIEW.md`) |
| Quality metrics | Track suggestion-acceptance rate (did the human confirm or reject the AI suggestion) per task type — this is the real-world equivalent of this benchmark's accuracy measurement, and should replace this synthetic benchmark's numbers once real usage data exists |
| Latency | Track per-call latency for both the embedding service and hosted-LLM calls — this pass measured 103-256ms for embeddings; hosted-LLM latency should be measured once a provider is chosen |
| Error rate | Track call failures (timeout, malformed response) separately from low-confidence suggestions |
| Fallback | If the AI call fails or times out, the row must fall through to "unresolved, needs manual mapping" — never block the import, never guess |
| Model replacement process | Since this is a suggestion-only, human-confirmed system, replacing the model (e.g., switching hosted LLM providers, or upgrading the embedding model) requires no migration of historical decisions — only re-validating against a small test set like this benchmark's golden dataset before switching |
| Human corrections | Every human correction to an AI suggestion should be captured (this is what feeds the per-brand-scoped attribute lookup table's self-improvement, per the original research design) |
| Evaluation dataset | This benchmark's `GOLDEN_DATASET.md` is a starting point, not a sufficient one — it should be expanded with real examples as real brand data becomes available (per `07-P08_REAL_DATA_READINESS.md` in the execution-readiness package) |
| Drift signal | Watch for a rising rate of human corrections/rejections over time on the same task type — that's the practical drift signal for a suggestion-only system, not a statistical drift-detection pipeline |

## What this explicitly does NOT require, for V1

A dedicated ML monitoring platform, an automated retraining pipeline, a feature store, or a model registry — none are justified by V1's scope (suggestion-only, human-confirmed, low call volume via deduplication). Revisit only if call volume or model count grows enough to justify it, per the same evidence-gated discipline the rest of this program already applies.
