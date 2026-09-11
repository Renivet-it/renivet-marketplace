# Open Decisions — P08

Reuses `16-final/OPEN_QUESTIONS.md` directly (confirming, not re-litigating, per the parent task's instruction) plus this package's own confirmation that each item has carried forward unchanged.

## DECISION REQUIRED — business/ops, not more research

1. **Actual brand-tier distribution** across ~50 brands (spreadsheet-only / export-capable / API-capable). The single most load-bearing unmeasured input across the whole program. A direct inventory/survey task, not a research task. **Carried forward unchanged** — still unmeasured as of this package.
2. **Human-review staffing/ownership**: who owns manual-mapping escalation once File-First runs at volume, and later the confidence-tier review queue if a Phase 2 spine is ever built. No current owner or SLA exists. **Carried forward unchanged.**

## DECISION REQUIRED — engineering, informed by data this program doesn't have

3. **SKU-matching threshold validation** — the 0.90/0.75 similarity thresholds in the superseded confidence model are explicitly INFERRED, not derived from Renivet data. Relevant only once V3's precondition chain (`10-roadmap/V3.md`) is otherwise satisfied.
4. **Embedding model fitness for identity matching** — which model populates `products.embeddings`/`semanticSearchEmbeddings`, and whether a search-relevance-tuned model is sound for identity discrimination, is UNKNOWN.
5. **`pg_trgm` availability** — whether Postgres trigram similarity is enabled in Renivet's database is UNKNOWN, unconfirmed in the original read-only pass and not re-checked by this package (outside this package's documentation-only scope to verify via a live DB query).
6. **The legacy credential model** (F8) — a second, global-env-var Unicommerce credential model coexists with the per-brand DB model; which is authoritative needs runtime/config inspection before the F10 fix ships cleanly.

## DECISION REQUIRED — fix, independent of this program's roadmap

7. **The F10 access-control gap** — re-verified CONFIRMED and still unfixed as of 2026-08-30 (this package's own direct code check). Not something this program's read-only scope fixes; flagged for prompt, independent action. See `08-reliability/SECURITY.md` and the DEF-010 cross-reference.

## Deliberately left open by program design (not a gap, a choice)

8. Whether Phase 2's full reconciliation spine, once triggered, should be built exactly as originally specified in `HYBRID.md`, or revised in light of brand-tier/match-threshold data available by then. The program recommends gating, not pre-committing to a fixed Phase 2 design now — this package's `10-roadmap/V2.md` preserves that stance rather than resolving it prematurely.

## Package-level addition: the business-authorization decision

9. **Whether Renivet leadership converts this package into tracked Linear work at all.** This is not a research open question — it is the Go/No-Go condition this package adds on top of the research's own open questions (`99-final/GO_NO_GO.md`), because zero Linear tracking currently exists for an Epic this thoroughly researched.
