# Feasibility Assessment — P08

## AI feasibility walk: DETERMINISTIC → EXISTING MAPPING → FUZZY/STATISTICAL → SMALL LOCAL MODEL → HUMAN REVIEW

This walk is applied per use case, reusing `14-critic/AI_CRITIQUE.md`'s conclusions rather than re-deriving them.

### Use case 1: Schema/column mapping

1. **DETERMINISTIC**: normalized exact match against a maintained alias dictionary. Handles the majority case — most brands reuse recognizable header conventions.
2. **EXISTING MAPPING**: a brand's own previously-confirmed mapping is replayed deterministically on every subsequent upload (Phase B of the mapping waterfall) — no AI on the hot path, ever, for a returning brand.
3. **FUZZY/STATISTICAL**: not the chosen layer here — schema mapping's ambiguity is semantic (does "Item Code" mean `sku` or `nativeSku`?), not merely a string-distance problem, so a pure trigram/edit-distance layer would under-perform.
4. **SMALL LOCAL MODEL / LLM-ASSIST**: used only for the residual columns the alias dictionary misses — one-time-or-deduped, always human-confirmed before first use regardless of confidence (BRule-2). This is where AI earns its place: genuine semantic ambiguity, low call volume (one call per never-before-seen column, not per row).
5. **HUMAN REVIEW**: mandatory gate before any new mapping is used, no exception for high confidence (`08-ai-opportunities/SCHEMA_MATCHING.md`'s explicit design point: schema mapping is low-frequency/high-blast-radius, unlike higher-frequency lower-blast-radius decisions elsewhere in the system).

**Verdict: BUILD now.** Feasible, narrow, well-gated, and closest to the minimum defensible AI footprint in the whole program (`14-critic/AI_CRITIQUE.md`).

### Use case 2: Attribute/value normalization

1. **DETERMINISTIC**: none applicable directly — raw values are free text.
2. **EXISTING MAPPING**: per-brand-scoped lookup table (corrected from a global table per `15-synthesis/SYNTHESIS.md` §6) — wins for closed vocabularies (sizing, standard colors, Renivet's own taxonomy): free, instant, deterministic, auditable.
3. **FUZZY/STATISTICAL**: viable as a lighter-weight alternative to AI for near-identical strings (e.g., trailing whitespace, casing) — worth using ahead of an AI call for cost reasons, though the research doesn't insist on this specific ordering.
4. **SMALL LOCAL MODEL / LLM-ASSIST**: used only on lookup-table misses, after deduplicating distinct values across the batch (a 5,000-SKU catalog typically has only tens of distinct raw strings per field). **Update, 2026-08-30 benchmark — genuine new decision, not a restatement:** a real, live-call benchmark (`MODEL_COMPARISON.md`, `EMBEDDING_BENCHMARK.md` in this folder) found the *existing* MiniLM-384 embedding service (already live, zero marginal cost) resolves this specific task at 100% top-1/top-3 accuracy with zero false positives on the golden dataset tested — materially better-suited here than a hosted LLM call, and cheaper. **Revised step 4: use the existing MiniLM-384 embedding for candidate ranking first; fall back to an LLM call (Claude Haiku 4.5 class, as originally costed) only if MiniLM's top candidate scores below a to-be-validated confidence margin.** The original hosted-LLM-only design is not wrong, just no longer the cheapest sufficient option for this specific use case — schema mapping (use case 1) is unaffected by this change and still uses the LLM path, since embeddings measurably underperform there. AI-resolved values (from either path) are still written back into the per-brand lookup table (self-improving; AI-call volume trends toward zero over time).
5. **HUMAN REVIEW**: category mapping (affects search/browse) held to a stricter review bar than size/color.

**Verdict: BUILD now**, with the per-brand-scoping correction applied.

### Use case 3: SKU/identity candidate matching

1. **DETERMINISTIC**: exact match (`sku`, `barcode`, normalized-title+attributes) — this is V1's entire identity-resolution scope, and it fully auto-resolves with no AI.
2. **EXISTING MAPPING**: a `brand_external_identifiers` pin-once table would let a once-confirmed match never need re-resolution — this table doesn't exist yet (Phase 2/V3, see `10-roadmap/V3.md`) and is precondition (c) for ever re-enabling any auto-apply fuzzy tier.
3. **FUZZY/STATISTICAL**: trigram similarity (`pg_trgm`, availability UNKNOWN) as a candidate-ranking signal for held rows.
4. **SMALL LOCAL MODEL / LLM-ASSIST / embeddings**: Renivet already has reusable embedding infrastructure (`products.embeddings` 384-dim, `semanticSearchEmbeddings` 768-dim with ivfflat/cosine indexes) — but which model populates them and whether a search-relevance-tuned model is fit for identity discrimination (a different task) is UNKNOWN and unverified. **Update, 2026-08-30 benchmark (`AI_MODEL_FEASIBILITY` docs in this folder — `MODEL_COMPARISON.md`, `EMBEDDING_BENCHMARK.md`):** a real, live-call benchmark confirmed the 384-dim model is MiniLM and the 768-dim model is E5-base-v2, and found E5's raw cosine scores are poorly calibrated on a *related* task (schema/attribute mapping, not identity matching directly) — it produced false positives on 100% of genuinely-unresolved test cases. This does not resolve identity-discrimination fitness (still UNKNOWN, untested here — no realistic product-title corpus exists), but it is directly relevant corroborating evidence: it reinforces, with a real measurement rather than a theoretical concern, why this use case's step 5 (mandatory human review) must stay non-negotiable at any confidence.
5. **HUMAN REVIEW**: mandatory for every fuzzy/AI-ranked candidate, at any confidence, per BRule-1 — this is the one use case in the whole walk where step 5 is non-negotiable regardless of how strong steps 3-4 look, because of the corrected Tier 2 finding (`05-algorithms/DECISION_LOGIC.md`).

**Verdict: BUILD the suggest-only queue (steps 1 and the human-gated tail of 3-5) now. DEFER any auto-apply beyond exact match** until the three preconditions in `05-algorithms/DECISION_LOGIC.md` are met.

### Use case 4: Anomaly detection

1. **DETERMINISTIC**: absolute thresholds (e.g., reject $0 or >500% deltas) — named in research as sufficient to catch the specific failure cases the brief worried about (100x price errors, impossible inventory jumps).
2. **EXISTING MAPPING / FUZZY-STATISTICAL**: rolling median/MAD or z-score per-SKU baseline, layered on top of absolute thresholds, expected to dominate the large majority of real anomalies.
3. **SMALL LOCAL MODEL / LLM-ASSIST**: explanation only, after a deterministic detector fires — never the detector itself (BRule-9).
4. **HUMAN REVIEW**: reviews the AI's plain-language explanation, not a raw statistical output.

**Verdict: BUILD rules now; BUILD AI-explanation as a thin layer now; DEFER any AI-as-detector design permanently**, not just for V1 — this is a hard guardrail, not a sequencing choice.

## MCP feasibility: not applicable for V1

This Epic is a **batch data-ingestion problem** — a brand uploads a file or an existing scheduled/API sync runs, data is parsed/mapped/validated/written, largely without an interactive human-AI conversation loop mid-transaction. MCP (Model Context Protocol) exists to give an LLM agent live, interactive tool access during a conversational or agentic session — there is no such session in this Epic's V1 architecture. Even the AI-assisted steps (schema-mapping suggestion, attribute normalization, SKU candidate ranking) are single-shot, narrow-input/narrow-output calls invoked by application code at specific pipeline stages, not an agent making autonomous tool calls against Renivet's systems. Introducing MCP here would add an interactive-agent abstraction layer to a problem that doesn't have an interactive agent in it. **Explicitly not applicable, now stated rather than silently assumed.**

## Overall feasibility verdict

V1 (File-First + minimal provenance + exact-match + schema/attribute AI-assist) is feasible at low engineering cost, reusing existing infrastructure (`product-import.tsx`, `inventorySource` pattern, `brandMediaItems`, existing embedding columns as a Phase 2 asset). The one item requiring investigation before implementation, not more research, is brand-tier distribution (see `07-feasibility/DEPENDENCIES.md`).
