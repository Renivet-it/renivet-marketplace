# Remaining Blockers — Consolidated

Every concrete blocker found across all gates, in one place, each with its owner-type and what resolves it.

| Blocker | Blocks | Owner type | What resolves it |
|---|---|---|---|
| DEF-009/010/002/003 have no Linear issue | Their own remediation; DEF-010's fix also closes F10 | Engineering leadership | Create 4 Linear issues, route through SPEC governance at L3 |
| REN-144 unimplemented | REN-131 (P06), and is itself a live P0 production risk | Engineering | Implement per its existing full specification |
| REN-143 evidence gap (placeholders unfilled, no Approver) | Trustworthy staging validation for all other work | Whoever owns REN-143 | Fill in `PHASE-A-EVIDENCE.md`/`PHASE-B-EVIDENCE.md`, get a named Approver |
| P01/P02 shared-file sequencing undecided | REN-146 and REN-147/151/160 landing without conflict | Whoever assigns P01/P02 work | A five-minute sequencing decision (Gate D already recommends one) |
| REN-95's 6 decisions are permanently lost | REN-95 implementation start | Product + Security + Finance (per the original decision topics) | Re-run the SPEC pilot and commit `docs/.work-items/REN-95/` this time |
| REN-131's dedup design predates REN-144's fix | REN-131 implementation start | Whoever owns both tickets | Sequence REN-144 → REN-131 → REN-133 (Gate B) |
| P08 has no leadership authorization | All of P08 except F10 | Renivet leadership | An explicit authorization decision |
| P08 has zero real brand-data corpora | P08 POC validation | Whoever owns brand/partner relationships or data sourcing | Source at least one representative file per format + one image set |
| P08's AI-assist design needs a hosted-LLM decision made, not just recommended | P08's `/SPEC` for tasks A/B/D/E | Whoever authorizes P08 | Adopt this pass's Option E recommendation (Gate H–K) as part of the authorization decision |

## Not a blocker, but worth correcting before it propagates further

P01's `01-research/EVIDENCE_INDEX.md` undercounts live external-ML call sites (says 4, actually 5 files/6 sites) and mislabels `getEmbedding768` as dead when it's live in two places. Recommend a documentation correction, not a re-investigation — this pass has already done the re-investigation.
