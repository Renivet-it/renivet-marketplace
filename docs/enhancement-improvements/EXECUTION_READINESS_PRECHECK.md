# Execution Readiness Precheck

Per program rule (§30): this is a **precheck**, not the final Portfolio Execution Readiness pass. It assesses whether each Epic's project-definition package is complete enough that `/SPEC` could be written against it without rediscovery — not whether the underlying work is safe or ready to ship. Checklist basis: requirements complete, user stories legitimate, architecture complete, algorithms defined, data defined, feasibility established, resources identified, alternatives evaluated, dependencies known, risks known, test strategy known, V1/V2/V3 defined, Linear mapping possible, SPEC can be written without rediscovery.

All five packages: 51/51 files present, no missing template file, "NOT APPLICABLE" used honestly where a section genuinely didn't apply (per each package's own report) rather than left blank.

## EPIC-P01-001 — Search & Ranking Intelligence

| Check | Status | Note |
|---|---|---|
| Requirements complete | ✅ | 9 active issues, each with FR/NFR traced to a Linear ID with file:line evidence |
| User stories legitimate | ✅ | 3 real stories out of 10 items; rest correctly routed to FUNCTIONAL_REQUIREMENTS instead |
| Architecture complete | ✅ | Two independent subsystems correctly distinguished (RAG/ILIKE retrieval vs. deterministic intent classifier) — a correction to the original portfolio summary |
| Algorithms defined | ✅ | Query understanding/retrieval/ranking/fallback/latency all covered; explicitly no ML needed |
| Data defined | ✅ | pgvector usage nuance corrected (`brands.embeddings` read live; `products.*embeddings` written, never read) |
| Feasibility established | ✅ | All 9 items GO or GO WITH CONDITIONS; REN-167 correctly DEFER |
| Resources identified | ✅ | ML/data-science specialist explicitly marked NOT NEEDED |
| Alternatives evaluated | ✅ | |
| Dependencies known | ✅ | Shared external-ML-host coordination with P02 identified (see cross-project critique) |
| Risks known | ✅ | Full failure matrix; external-vendor-ownership gap named as a real organizational risk |
| Test strategy known | ✅ | Aligned to existing SPEC→REVIEW→TEST governance, not duplicated |
| V1/V2/V3 defined | ✅ | REN-167's trigger is concrete (fallback-activation-rate data) though the exact threshold is itself a named DECISION REQUIRED |
| Linear mapping possible | ✅ | 1:1 to existing REN-### issues |
| SPEC-writable without rediscovery | ✅ | |

**Verdict: READY FOR EXECUTION.** No blocking gaps. 5 small DECISION REQUIRED items (log-count location, SQL-predicate choice, timeout duration, TLS support, external-vendor ownership) are implementation-detail-level, not package-completeness gaps — normal for a SPEC to resolve.

## EPIC-P02-001 — Recommendations & Personalization

| Check | Status | Note |
|---|---|---|
| Requirements complete | ✅ | 6 items, all traced |
| User stories legitimate | ✅ | Including one honestly-flagged borderline case (US-4, latency) rather than smuggled through |
| Architecture complete | ✅ | REN-147 reframed as "port PDP's existing working fallback pattern" — lower cost than originally scoped |
| Algorithms defined | ✅ | Separated by placement (cart, PDP, shop-sort); confirms cart and PDP share one function today |
| Data defined | ✅ | |
| Feasibility established | ✅ | REN-147/150/157/160 GO; REN-165 verification-required (not GO); REN-168 correctly DEFER |
| Resources identified | ✅ | No new specialist needed beyond a content/copy reviewer |
| Alternatives evaluated | ✅ | |
| Dependencies known | ✅ | Shared external-ML-host coordination with P01 identified from its own side too |
| Risks known | ✅ | |
| Test strategy known | ✅ | |
| V1/V2/V3 defined | ✅ | REN-168 gated on "demonstrated business need" with a proposed evidentiary standard flagged for ratification (DECISION REQUIRED, not a gap) |
| Linear mapping possible | ✅ | |
| SPEC-writable without rediscovery | ✅ | |

**Verdict: READY FOR EXECUTION.** Same coordination item as P01 (see Cross-Project Fix below) is the only cross-cutting action needed; package-internal completeness is not in question.

## EPIC-P05-001 — Customer Journey & UX

| Check | Status | Note |
|---|---|---|
| Requirements complete | ✅ | REN-144 found sharper/worse than originally scoped (explicit fail-open catch-and-continue, "Order Placed Successfully" shown on partial success) |
| User stories legitimate | ✅ | |
| Architecture complete | ✅ | Full checkout/payment state machine documented, including the currently-broken states |
| Algorithms/state transitions defined | ✅ | |
| Data defined | ✅ | |
| Feasibility established | ✅ | REN-144 GO; REN-95 GO WITH CONDITIONS |
| Resources identified | ✅ | Product/security/finance sign-off capacity named as needed but not confirmed to exist — flagged, not assumed |
| Alternatives evaluated | ✅ | Explicitly rejects a distributed-saga framework for REN-144 as overkill |
| Dependencies known | ⚠️ | REN-95's "6 blocking decisions" are referenced but not actually enumerated anywhere retrievable — the package itself flags this as a gap rather than papering over it |
| Risks known | ✅ | REN-144 identified as needing a durable reconciliation record, not just a transaction wrapper, since a browser close can interrupt the flow regardless of transaction boundaries |
| Test strategy known | ✅ | |
| V1/V2/V3 defined | ✅ | Order-then-pay architecture change gated on measured post-V1.1 incident rate, not a date |
| Linear mapping possible | ✅ | |
| SPEC-writable without rediscovery | ⚠️ | REN-95 specifically cannot proceed to `/SPEC` until its 6 decisions are actually located/enumerated — everything else in this package can |

**Verdict: READY FOR EXECUTION, with one named exception.** REN-144 and the rest of this Epic's V1 scope are execution-ready now. REN-95 needs its 6 decisions actually enumerated (not just referenced) before `/SPEC` can be written against it — this is the single most concrete non-coordination gap found across all 5 packages.

## EPIC-P06-001 — Measurement & Experimentation

| Check | Status | Note |
|---|---|---|
| Requirements complete | ✅ | REN-145's currency+fanout defects both independently re-confirmed at exact code locations |
| User stories legitimate | ✅ | Deliberately thin — most items correctly left as engineering requirements |
| Architecture complete | ✅ | Event/identity/attribution model documented; the 11/15/2/0 purchase-count discrepancy explained, not just noted |
| Algorithms defined | ✅ | `cart_added`/`add_to_cart` asymmetry root-caused (server-unconditional vs. client-hook-gated) |
| Data defined | ✅ | PostHog-strict-2 correctly framed as a measurement artifact, not a real signal |
| Feasibility established | ✅ | REN-145/131/132/133/134 GO; REN-166 correctly DEFER pending product decision |
| Resources identified | ✅ | |
| Alternatives evaluated | ✅ | Explicitly rejects building a shared `emitCommerceEvent()` abstraction for V1 |
| Dependencies known | ✅ | Correctly treats REN-144 (P05) as a coordinate-with, not a blocking precondition already met |
| Risks known | ✅ | Self-identified a NEW risk: shipping REN-131 without coordinating REN-133's dedup could introduce a new double-counting defect |
| Test strategy known | ✅ | |
| V1/V2/V3 defined | ✅ | |
| Linear mapping possible | ✅ | |
| SPEC-writable without rediscovery | ✅ | |

**Verdict: READY FOR EXECUTION.** The REN-131/REN-133 sequencing risk it self-identified should be carried into whoever writes those two `/SPEC`s as a single coordinated pair, not two independent SPECs — a sequencing note, not a completeness gap.

## EPIC-P08-001 — Brand Data & Commerce Integration Platform

| Check | Status | Note |
|---|---|---|
| Requirements complete | ✅ | 17 FRs, all traced to specific research-wave documents |
| User stories legitimate | ✅ | |
| Architecture complete | ✅ | Full ingest→map→validate→dry-run→approve→write→reconcile state machine, Mermaid-diagrammed |
| Algorithms defined | ✅ | DETERMINISTIC→EXISTING MAPPING→FUZZY→SMALL LOCAL MODEL→HUMAN REVIEW walk complete; Tier-2-auto-apply correction preserved exactly (never restated as current guidance) |
| Data defined | ✅ | Import-batch + import-record recommended as the smallest safe V1 RDBMS design |
| Feasibility established | ✅ | F10 and `xlsx@0.18.5` both re-verified against LIVE code as of 2026-08-30 — both unchanged/still present |
| Resources identified | ✅ | No dedicated ML engineer needed; bounded hosted-LLM API cost |
| Alternatives evaluated | ✅ | The "shared spine = hand-built iPaaS" overengineering risk explicitly named and resolved to minimal-slice-only |
| Dependencies known | ✅ | |
| Risks known | ✅ | F10/DEF-010 cross-reference preserved; 6 DECISION REQUIRED items carried forward unchanged from the research's own OPEN_QUESTIONS.md, plus one new package-level item (leadership authorization) |
| Test strategy known | ✅ | POC failure scenarios from the original research plan carried forward |
| V1/V2/V3 defined | ✅ | 5-item trigger table, all observable events, no dates |
| Linear mapping possible | ⚠️ | **Zero Linear issues exist for this Epic** — mapping is possible in principle (the package names what issues *should* be created) but none exist yet |
| SPEC-writable without rediscovery | ⚠️ | Requires a Renivet leadership decision to authorize converting this into tracked work FIRST — the package is SPEC-ready in content, but `/SPEC` conventionally starts from a Linear ID, and none exists |

**Verdict: GO WITH CONDITIONS, not unconditional READY.** The package itself is complete and SPEC-writable in substance — the gap is authorization and Linear tracking, not documentation quality. **The F10 access-control fix should proceed independent of this Epic's broader authorization decision** — it's a live security defect, not a feature awaiting greenlight.

## Cross-project item (from `CROSS_PROJECT_CRITIQUE.md`)

**Action needed before P01/P02 execution starts concurrently:** assign explicit ownership/sequencing for `src/lib/python/sematic-search.ts` and `src/lib/python/product-recommendation.ts`, which REN-146 (P01) and REN-147/REN-160 (P02) will both edit. Both packages identified this correctly and both declined to force a premature shared abstraction — the only missing piece is a five-minute sequencing decision, not new design work.

## Summary

| Epic | Readiness |
|---|---|
| P01 | READY FOR EXECUTION |
| P02 | READY FOR EXECUTION |
| P05 | READY FOR EXECUTION (REN-95 needs its 6 decisions actually enumerated first) |
| P06 | READY FOR EXECUTION (REN-131/133 should be sequenced as a coordinated pair) |
| P08 | GO WITH CONDITIONS (leadership authorization + Linear tracking needed; F10 fix should proceed independently now) |

No Epic scored NOT READY. The full Portfolio Execution Readiness pass (distinct from this precheck, per §30) is intentionally not run in this pass.
