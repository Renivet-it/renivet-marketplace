# Final Portfolio Execution Readiness Decision

Produced 2026-08-30, final pre-execution control pass. Answers only the 12 governing questions. Every claim below is either re-verified directly this session (Linear API, source grep, filesystem search) or cites the specific existing gate document it depends on — nothing is asserted from memory.

## 1. Is the program ready for execution?

**READY WITH CONDITIONS.** No Epic is blocked by an unrecoverable problem. 4 of 5 Epics (P01, P02 unconditionally; P05, P06 with one named exception each) can enter `LINEAR → SPEC → DEVELOPMENT` now. The 5th (P08) cannot start as a whole, but its blockers are a business decision and a data-sourcing task, not engineering or design gaps — and it has one independent piece (F10, via DEF-010) that should proceed immediately regardless.

## 2. What are the remaining blockers?

Nine concrete items, each with a named owner-type and resolution (full detail in `16-REMAINING_BLOCKERS.md`, re-verified this pass):

1. DEF-009, DEF-010, DEF-002, DEF-003 have no Linear issue (confirmed via direct Linear keyword search this session — zero matches).
2. REN-144 is unimplemented (confirmed `Backlog`, Urgent, this session) — a live P0 production risk.
3. REN-143's evidence gap — Linear says "Deployed to Prod," the work item's own `work-item.yaml` says `IN_REVIEW` with unfilled evidence placeholders (confirmed this session, direct file re-read).
4. P01/P02 shared-file sequencing (REN-146 before REN-151/147/160) needs to be an assigned decision, not left implicit.
5. REN-95's original 6 decisions are permanently lost (confirmed this session: no trace on any branch, tag, or in the Linear issue's zero comments) — needs a re-run, committed SPEC pilot.
6. REN-131's dedup design predates REN-144's fix — needs re-validation once REN-144 ships, not assumed to transfer unchanged.
7. P08 has no leadership authorization (confirmed this session: `docs/decisions/` contains only its own README, no ADR).
8. P08 has zero real brand-data corpora (confirmed this session: no Shopify/ERP/messy-file/image-corpus sample exists anywhere in the repository).
9. P08's AI-assist architecture needs its recommendation (Option E, hosted-LLM fallback + reused MiniLM-384 for attribute normalization) formally adopted as part of the authorization decision, not left as "recommended but not decided."

## 3. Which blockers require human decisions?

Two, and only two, are genuine human/business decisions rather than engineering actions:
- **P08's leadership authorization** (item 7) — no one has decided whether to convert completed research into tracked engineering work.
- **REN-95's underlying product/security/finance decisions** (guest-checkout identity model, PII policy, payment/refund policy, COD policy, account-linking, coupon policy) — these were never actually answered (only topic-labeled), and require Product + Security + Finance input during the re-run SPEC pilot, not just an engineering re-run.

Everything else (items 1–6, 8–9) is an engineering, process, or data-sourcing action with no ambiguity about who does it or how.

## 4. Which blockers require Linear tracking?

Items 1 (DEF-009/010/002/003 — 4 new issues, see `19-LINEAR_EXECUTION_PREPARATION.md` Track A) and, downstream of the Gate F decision, P08's 9 new issues (Track C of the same document, F10 folded into DEF-010). Items 2, 3, 5, 6 already have Linear issues (REN-144, REN-143, REN-95, REN-131/133 respectively) — they need action or a process re-run, not new tracking.

## 5. Which Epic can start first?

**P01 and P02 can start immediately, unconditionally** — both confirmed READY with no blocking item. Between them, no ordering is required; they share files (Gate D) but not a readiness dependency.

## 6. Can P08 start first?

**No, not as the first Epic to enter engineering.** It is the best-*prepared* Epic (deepest research, most critique rounds, only Epic with a fully evidenced AI architecture decision already made) but the *least authorized* — starting it first would mean starting engineering work with no leadership sign-off and no data to validate against, which is precisely the gap this pass's own instructions warn against exploiting. F10's fix (via DEF-010) is the one piece of "P08" that should start immediately, but that is a security fix riding on the DEF-010 issue, not P08 Epic work.

## 7. What is the P08 AI decision?

**Deterministic-first, hosted-LLM-API fallback for the genuinely ambiguous residual (Option E), with one existing model reused narrowly.** Precisely:
- **Schema/column mapping:** deterministic alias-dictionary matching resolves 92.3% (measured, small/synthetic benchmark — directional, not production-grade). The unresolved residual goes to a hosted LLM API call (structured JSON output, timeout-bound, deduplicated per unique column per brand), always human-confirmed regardless of confidence.
- **Attribute normalization:** deterministic dedup+lookup resolves 87.5% (measured). The residual is ranked by the **existing, already-live MiniLM-384 embedding service** (measured 100% top-1/top-3, zero false positives on this benchmark) — reused for candidate ranking only, never for the write itself.
- **SKU/identity matching:** deterministic exact-match only, in V1. Any AI-assisted fuzzy ranking is explicitly deferred pending real match data, provenance, and pin-once persistence — never auto-applies at any confidence, a hard rule this pass reinforces rather than loosens.
- **E5-base-v2-768** (Renivet's other existing embedding model) is explicitly **rejected** for any P08 task — measured worse than deterministic on schema mapping and produced false positives on 100% of genuinely-unresolved test cases in the benchmark.
- **Qwen3-Embedding-0.6B**, though it benchmarked best-calibrated of all options tested, is explicitly **deferred** — self-hosting it is a new operational commitment Renivet has no evidenced ML-ops capacity for; it remains a benchmarked, ready candidate if Phase 2 volume ever justifies revisiting.

**Caveat carried through every layer of this decision, not just stated once:** the benchmark dataset is small and synthetic. Every percentage above is directional feasibility evidence, not a production-accuracy claim.

## 8. Does P08 require new infrastructure?

**No.** The recommended architecture (Option E) needs zero new hardware, zero GPU/CPU provisioning, zero new service to run or monitor — only a standard outbound HTTPS call from existing server-side code (tRPC procedure or route handler), architecturally identical to Renivet's existing Razorpay/Delhivery/Meta CAPI integration pattern. Model inference happening inside a Vercel serverless function itself is explicitly rejected (memory limits, cold starts, no GPU) — but that is not what this architecture does; it makes an outbound API call, which is safe. Confirmed this session: zero `import_batch`/`import_record` schema exists yet (genuinely new tables, standard Postgres rows — not infrastructure in the compute/hosting sense).

## 9. What is the safest V1?

Exactly what the original P08 research converged on and this pass re-validated against current code, changing nothing:

**File-First ingestion** (extend `product-import.tsx` after the confirmed-still-unfixed `xlsx@0.18.5` vulnerable-dependency upgrade) **+ minimal provenance** (generalizing the existing `products.inventorySource`/`inventoryLastSyncedAt` pattern) **+ import-batch/import-record data model** (smallest safe design — natural transaction boundary, per-row status, audit trail "for free," re-confirmed zero existing duplication in schema) **+ exact-match-only identity resolution** (never fuzzy/AI-auto-applied) **+ hosted-LLM-assisted schema/attribute mapping** (human-confirmed, never auto-applied, MiniLM-384 reused only for attribute-normalization ranking) **+ mandatory dry-run/diff + explicit approval gate before any write** **+ `brandMediaItems` reuse for media** (pure extension, no schema change, UploadThing remains the storage provider, Redis stays a read-time cache only, never authoritative storage).

## 10. What should remain deferred?

Generalized API-First ingestion tier; a scheduled-file tier; the full reconciliation/confidence-review spine; any AI-assisted SKU-matching beyond suggest-only; any self-hosted or fine-tuned model (including Qwen3-Embedding-0.6B, despite testing best); MCP (P08 V1's shape is a synchronous upload → map → dry-run → approve flow, not an open-ended agentic task — no current consumer justifies it); REN-167/REN-168 (both correctly gated on data that doesn't exist yet); REN-166 (gated on `DECISION-P06-001`, a product decision on whether GA4 is needed at all).

## 11. What is the exact first engineering action?

**Implement REN-144** (payment/order integrity — transaction boundaries around order-row creation, cart-clearing scoped to actually-succeeded items, an explicit partial-vs-full-success signal). It is fully specified with zero remaining unknowns beyond implementation effort, is the single highest-severity confirmed defect with a Linear issue already open (`Backlog`, Urgent, re-confirmed this session), and unblocks REN-131/133 downstream. Run in parallel, not sequentially: create the 4 Linear issues for DEF-009/010/002/003 (Track A of `19-LINEAR_EXECUTION_PREPARATION.md`) — this is the single highest-severity *gap* in the portfolio (untracked P0s), even though it is not itself the first line of code to be written.

## 12. What is the exact first `/SPEC` action?

**Open `/SPEC` on REN-144**, using its already-complete Linear description (problem, root cause, in/out of scope, acceptance criteria, test requirements, rollback, observability — all present in the issue today, confirmed this session) as the SPEC input. In parallel, open `/SPEC` on DEF-010 once its Linear issue is created (Track A2) — the single fix pattern (per-procedure ownership check, already correctly implemented elsewhere at `brand-product-type-packing.tsx`) applies across all 51 procedures and closes P08's F10 as a byproduct.

## Overall

**READY WITH CONDITIONS.**

Confirm:
- "No application code was modified."
- "No tests were modified."
- "No infrastructure was changed."
- "No Linear issues were created or modified."
- "No GitHub push was performed."

All five hold. This pass read source, ran read-only Linear queries (`get_issue`, `list_issues`), ran read-only git commands (`fetch`, `status`, `branch`, `log`), and wrote only to `docs/enhancement-improvements/execution-readiness/18-`, `19-`, and `20-` in this repository.
