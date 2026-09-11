# ML/AI Lifecycle

Canonical stages (§18): `PROBLEM → DATA CONTRACT → DATASET → FEATURES → BASELINE → MODEL/ALGORITHM → OFFLINE EVALUATION → POC → LOCAL → STAGING → EXPERIMENT → PRODUCTION → MONITORING → DRIFT → RETRAIN/ROLLBACK/RETIRE`.

## Honest starting point: this lifecycle has almost nothing to attach to today

Per `02-epics/EPIC_MAP.md`'s P07 reconciliation, this pass found **no evidence of Renivet owning, training, evaluating, or operating a model of its own**, anywhere in the repository, research, or audit corpus. What exists:

1. **A third-party external ML/search microservice** Renivet calls for semantic search embeddings, RAG search, recommendation similarity, and suggestions (behind REN-146, REN-148, and the shared dependency edge in `DEPENDENCY_GRAPH.md`). Renivet does not own this model — it owns the *integration* to it, and the integration is under-hardened (no timeouts, hardcoded non-TLS endpoint). This is an **integration reliability problem**, not an ML lifecycle problem. Do not apply DATA CONTRACT/DATASET/FEATURES/BASELINE/OFFLINE EVALUATION/DRIFT/RETRAIN stages to REN-146/148 — none of them apply to hardening a client of someone else's model.
2. **P08's AI-assistance design** (`docs/research/brand-commerce-integration/08-ai-opportunities/`) — the most substantial AI *design* thinking in the portfolio, but it is explicitly narrow, human-gated assistance (schema/column mapping, attribute normalization, anomaly explanation, SKU-match suggestion), not model training or an ML pipeline. It already has its own guardrail/confidence framework (`AI_GUARDRAILS.md`, `CONFIDENCE_MODEL.md`) and its own critic pass (`AI_CRITIQUE.md`) — reference those directly rather than forcing them through this lifecycle's stages, which assume a trained model this design never proposes building.

## Where this lifecycle *would* apply, if P07 is ever formalized

| Stage | What would trigger it |
|---|---|
| PROBLEM | A named business need only a trained model can solve — not yet identified anywhere in this reconciliation. |
| DATA CONTRACT / DATASET | Would require Renivet to own the data pipeline feeding a model — currently, all "AI" surfaces (P08's schema mapping, the external ML microservice) consume ad hoc inputs, not a versioned dataset. |
| BASELINE | Per the anti-overengineering discipline P08 already models (`14-critic/ANTI_OVERENGINEERING.md`) — always compare against a deterministic/rules-based baseline first. Both P08's AI-critique and this document agree: most of what looks like "we need ML" resolves to "we need a better deterministic rule" on inspection. |
| MODEL/ALGORITHM through PRODUCTION/MONITORING/DRIFT/RETRAIN | Not applicable until a real model is commissioned. Do not pre-build MLOps infrastructure (feature stores, retraining pipelines, drift detection) speculatively — see `PORTFOLIO_ANTI_OVERENGINEERING.md`. |

## Recommendation

Do not formalize P07 or build any ML lifecycle tooling now. If a genuine model-training need emerges (e.g., a Renivet-owned ranking model, distinct from calling the external similarity service), re-evaluate against this lifecycle at that point — and apply the same BASELINE-first, human-gated-confidence discipline P08's AI governance already established, rather than inventing a new framework.
