# Gate D — P01 / P02 Shared Change Plan

Re-verified 2026-08-30 directly against current code. **Corrects P01's own `01-research/EVIDENCE_INDEX.md`** on two points (see below) — that document should be updated to match this finding.

## Corrected live-call-site count: 5 live files / 6 live call sites, not 4

P01's `EVIDENCE_INDEX.md` (line 31) states "5 distinct source files, one dead" = 4 live. Direct verification found **5 live files**, because `src/app/api/search/products/route.ts` (lines 5, 15 — its own hardcoded `PYTHON_SERVICE_URL` constant) was missed alongside the already-documented `src/app/api/search/suggestions/route.ts` (lines 7, 37).

**Full live-call-site list:**
- `src/lib/python/sematic-search.ts` — lines 11, 42 (`getEmbedding`, `getEmbedding768`)
- `src/lib/python/product-recommendation.ts` — line 10 (`getAdvancedRecommendations`)
- `src/lib/db/queries/product.ts` — line 1215 (or the equivalent current call site inside `getProducts`)
- `src/app/api/search/suggestions/route.ts`
- `src/app/api/search/products/route.ts`

`src/lib/python/ai-suggestion.ts` remains confirmed dead (zero importers anywhere in `src/`, grep-verified) — REN-156's target.

**Second correction:** P01's `EVIDENCE_INDEX.md` row 21 flags `getEmbedding768` as "no confirmed caller — INFERRED dead." **This is wrong** — it's live at `src/lib/trpc/routes/general/cart.ts:825` and `src/lib/trpc/routes/brands/products.ts:760`.

## REN-146 vs. REN-147/160 — genuine same-line overlap, not just same-file

P02's own `03-requirements/FUNCTIONAL_REQUIREMENTS.md` (FR-1.4, line 11) requires REN-147 to fix "the dead `EMBEDDING_SERVICE_URL`/hardcoded-host discrepancy in `getAdvancedRecommendations` and `getEmbedding768`" — the exact same lines REN-146 targets for its timeout+env-var fix (`product-recommendation.ts:5-10`, `sematic-search.ts`'s `getEmbedding768`). P02's own `07-feasibility/DEPENDENCIES.md` (line 5) already states this plainly: "shipping them uncoordinated risks two teams editing `product-recommendation.ts`/`sematic-search.ts` at the same time."

Beyond that specific overlap:
- REN-147's larger surface (a new independent Postgres fallback chain, ported from PDP's `YouMayAlsoLike`) lands in `cart.ts` — non-overlapping with REN-146.
- REN-160's caching wraps the call sites of `getPersonalizedRecommendations`/`getAdvancedRecommendations` — additive, low conflict with REN-146.
- **Within P01 itself:** REN-151 (parallelize embedding+RAG fetch) and REN-146 (add timeouts) both target `product.ts` lines ~1177-1230 — the same region, a same-Epic overlap worth sequencing too.

## Recommended sequencing

1. **REN-146 first** — mechanical fix (add timeout + real env-var config) across the 5 live files. Low risk, unblocks everything downstream that touches the same lines.
2. **REN-151 as the same PR as REN-146, or immediately after** — both hit `product.ts:1177-1230`; doing them together avoids a rebase.
3. **REN-147 rebases on REN-146** — its FR-1.4 requirement is already satisfied by REN-146's fix; REN-147's remaining work (the new cart.ts fallback chain) doesn't re-touch the shared client files.
4. **REN-160 in parallel with or after REN-147** — additive caching, low conflict either way.

## Merge/rebase implications

No genuine architectural conflict exists — only an ordering dependency. Assign REN-146 to whoever starts first (P01 or P02 owner), and have the other Epic's owner rebase their affected work on top rather than editing the same lines independently. This is a five-minute sequencing decision, not new design work, consistent with the prior cross-project critique's finding.

## Validation implications

Once REN-146 ships, REN-167 (P01, typo-tolerant fallback) becomes newly gated on the fallback-activation-rate data REN-146's timeout/logging produces — no change to that gate's logic, just confirming the trigger source is now correctly identified as coming from this same file set.
