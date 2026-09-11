# Final Portfolio Readiness — Per-Epic

Produced 2026-08-30 as the final pre-execution control pass. This document does not re-derive Gates A–L (`01`–`17` in this directory) — it re-verifies their highest-stakes claims directly (Linear API queries + source-code grep, this session) and adds nothing unverified. Verification performed fresh in this pass: `REN-144`, `REN-131`, `REN-133`, `REN-95`, `REN-143`, `REN-146`, `REN-136` pulled directly from Linear (status, description, relations); `DEF-009`/`DEF-010`/`DEF-002`/`DEF-003`-shaped keyword searches against Linear (cross-tenant credentials, `/api/permission`, Delhivery AWB stuck, inventory double-decrement, Unicommerce, brand data integration) — zero matches beyond issues already known and named below; `src/lib/trpc/routes/brands/brands.ts` re-read directly (confirms `isTRPCAuth(..., "brand")` never compares `input.brandId` to caller's own brand, at every one of the 6 named procedures); `package.json`/`.nvmrc` re-read (Node 24.x confirmed); `docs/decisions/` re-read (contains only its own README, no ADR — confirms no P08 authorization record exists); repo-wide search for Shopify references, CSV/XLSX samples, and `import_batch`/`import_record` schema columns re-run directly (all confirmed absent, matching Gates G and 22).

## P01 — Search & Ranking Intelligence

**Current state:** Research and SRS complete. Zero Linear issues have entered `/SPEC` (confirmed: `12-traceability/ISSUE_TASK_MAP.md` shows every row `NOT YET CREATED` for SPEC/REVIEW/TEST/STAGING/RELEASE; no `docs/.work-items/REN-146/` or sibling directories exist). REN-146 and REN-151 both independently confirmed still `Backlog` in Linear this pass.

**Ready?** **READY.**

**Blockers:** None blocking start. One documentation correction owed, not a blocker: P01's own `01-research/EVIDENCE_INDEX.md` undercounts live external-ML call sites (states 4, actually 5 files/6 sites — Gate D) and mislabels `getEmbedding768` as dead when it is live at `cart.ts:825` and `brands/products.ts:760`.

**Dependencies:** Shares two live files (`product.ts` lines ~1177–1230, and the `product-recommendation.ts`/`sematic-search.ts` call sites) with P02's REN-147. No dependency on P05/P06/P08.

**Next step:** Sequence REN-146 + REN-151 as one coordinated change (same lines, avoids a rebase — Gate D), then open its `/SPEC`. Independently: REN-149, REN-154, REN-155, REN-156, REN-158, REN-159 have zero open decisions blocking a start (per P01's own `99-final/OPEN_DECISIONS.md`) and may proceed in any order. REN-148 and REN-167 remain correctly deferred/gated.

## P02 — Recommendations & Personalization

**Current state:** Research and SRS complete, same zero-Linear-`/SPEC`-entry status as P01 (no `docs/.work-items/REN-147/` or siblings).

**Ready?** **READY.**

**Blockers:** None blocking start. REN-147's larger scope (new independent Postgres fallback chain in `cart.ts`) must rebase onto REN-146 rather than editing the same lines independently (Gate D) — a sequencing note, not a blocker.

**Dependencies:** Same shared-file overlap with P01 named above. `getShopRecommendations`'s live/dead status should be confirmed (P02's own `11-critique/ARCHITECTURE_CRITIQUE.md` #2) before REN-160 targets it.

**Next step:** REN-147 rebases on REN-146 once REN-146 lands; REN-160 proceeds in parallel or after (additive caching, low conflict); REN-150 and REN-157 have zero open decisions and may start immediately. REN-165 and REN-168 remain correctly deferred pending their named triggers.

## P05 — Customer Journey & UX

**Current state:** Research and SRS complete. Confirmed this pass: REN-144 is `Backlog`, Urgent priority, in Linear with a full spec-grade description already attached (transaction boundary + partial-success signal for order creation) — not yet implemented. REN-95 is `Backlog`, High priority, in Linear — description is the original 3-layer guest-checkout bug report only, containing no trace of the 6 `DEC-001`–`DEC-006` decisions the prior SPEC pilot produced.

**Ready?** **READY WITH CONDITIONS.**

**Blockers:**
- REN-95's original 6 decisions are confirmed **permanently lost** (Gate C) — the pilot ran in worktree `.worktrees/renivet-spec-governance` on branch `codex/renivet-spec-governance`, never merged, no longer exists; `docs/.work-items/REN-95/` does not exist on any branch or tag; the Linear issue itself has zero comments. Only topic labels survive (`03-REN95_DECISION_REGISTER.md`). REN-95 cannot proceed to implementation until its SPEC pilot is **re-run** with `docs/.work-items/REN-95/` artifacts actually committed this time.
- Everything else in P05 (REN-144, REN-152, REN-153, REN-161, REN-163, Guest Journey findings REN-108–112) is unconditionally ready — REN-144 has zero remaining unknowns beyond implementation effort.

**Dependencies:** REN-144 is the upstream dependency for P06's REN-131 (Gate B) — must ship first.

**Next step:** Start REN-144 implementation immediately (fully specified). Re-run REN-95's SPEC pilot as a governance action in parallel, this time committing its output. Remaining P05 backlog items proceed independently, any order.

## P06 — Measurement & Experimentation

**Current state:** Research and SRS complete. Confirmed this pass directly from Linear: REN-131 (`Backlog`, High, assigned) never references REN-133 or REN-144 anywhere in its own contract; REN-133 (`Backlog`, Medium, assigned) is real and exists in Linear (correcting an earlier reconciliation's claim that it didn't) but its scope is purely client-side helper extraction, not server-side dedup, and has no `docs/.work-items/REN-133/` SPEC yet.

**Ready?** **READY WITH CONDITIONS.**

**Blockers:**
- **REN-131 is NOT READY until REN-144 (P05) ships.** REN-131's approved `DEC-131-001` design (fire one `purchase_completed` per checkout, keyed by a stable order-group identifier) was built against today's fragile, non-transactional order-creation behavior. Implementing it first risks firing a "complete checkout" analytics event for a checkout that only partially succeeded — the exact overstated-conversion risk REN-131's own contract names without yet having the fix that prevents it (Gate B).
- **REN-133 is NOT READY until REN-131 exists** to reference — its eventual `/SPEC` must cite REN-131's dedup identifier so client-side and server-side event semantics don't diverge.
- REN-145, REN-132, REN-134 are unconditionally ready, independent of the above.
- REN-166 stays correctly deferred pending `DECISION-P06-001` (GA4 second-source decision, owned by product).

**Dependencies:** REN-144 (P05) is the hard upstream dependency for REN-131 → REN-133.

**Next step:** REN-145/132/134 proceed now. REN-131 waits on REN-144 shipping, then re-validates its dedup design against REN-144's actual implementation (not assumed to transfer unchanged). REN-133 follows REN-131, `/SPEC` required to cite `DEC-131-001`.

## P08 — Brand Data & Commerce Integration Platform

**Current state:** The most research-mature, most adversarially-reviewed, and least-tracked Epic in the portfolio (16/16 research phases complete, 51-file SRS package, 4 rounds of critique, a 2026-08-30 live AI benchmark). Confirmed this pass: zero Linear issues reference "Unicommerce," "brand data integration," or any P08 functional requirement (direct Linear keyword search, this session); `docs/decisions/` holds no ADR authorizing it; no Shopify/ERP/messy-file/image-corpus sample exists anywhere in the repo (direct search, this session — Shopify appears exactly once, as an unrelated CSS class name in `dashboard.css`).

**Ready?** **NOT READY** (with one independent, unconditionally-ready carve-out).

**Blockers (only two, both business/data-ops, neither engineering):**
1. **No leadership authorization.** No decision record, ADR, meeting log, or Linear artifact anywhere states P08 is approved to proceed to implementation (Gate F). Technical readiness is not authorization.
2. **Zero real brand-data corpora.** All 6 required corpus types (Unicommerce export, Shopify export, generic Excel/CSV, ERP export, a messy real file, a representative image set) are confirmed MISSING (Gate G, re-confirmed this pass). This blocks POC *validation*, not architecture — deterministic ingestion code can be written against the confirmed schema/contract design without real data; validating mapping quality against real brand messiness cannot happen until at least one file per format is sourced.

**Independent carve-out — proceeds regardless of the above:** F10 (the Unicommerce brand-settings cross-brand access-control gap) is a confirmed-live, HIGH-severity defect, re-verified unfixed as of this pass by direct code read (`brands.ts` lines 193/231/320/412/497/587/633 all gate on `isTRPCAuth(BitFieldBrandPermission.ADMINISTRATOR, "all", "brand")` — a permission-bitfield check that never compares `input.brandId` to the caller's own brand). F10 is a verified strict subset of the broader, also-untracked DEF-010 (51/104 brand-router procedures repo-wide) — fix DEF-010 and F10 closes as a byproduct; do not track them as two separate defects.

**Dependencies:** None on P01/P02/P05/P06. P08 is additive infrastructure (brand-side data ingestion) that those Epics don't consume and aren't consumed by.

**Next step:** Get an explicit leadership Go/No-Go decision (the research already answers every technical question a decision-maker would need — see `99-final/GO_NO_GO.md`). In parallel, source at least one representative file per corpus type. Independent of both: raise DEF-010 (with F10 as corroborating evidence) through the urgent-safety track below and fix it now.

## Summary table

| Epic | Ready? | Blocking items | Human decision required? |
|---|---|---|---|
| P01 | READY | None (1 doc correction owed) | No |
| P02 | READY | None (1 sequencing note) | No |
| P05 | READY WITH CONDITIONS | REN-95 SPEC re-run | No (process action) |
| P06 | READY WITH CONDITIONS | REN-131/133 wait on REN-144 | No (sequencing, already decided) |
| P08 | NOT READY (F10 carve-out excepted) | Leadership authorization; real data sourcing | **Yes — authorization is a business decision** |
