# Audit Finding → Epic Traceability — P02

Per `../../AUDIT_TO_BACKLOG_TRACEABILITY.md` (portfolio-level source of truth; reproduced/annotated here for this Epic's package):

| Audit finding | Disposition | Epic | Linear issue | Verified this pass? |
|---|---|---|---|---|
| RE-F002 (Recommendation fallback) | KEEP | EPIC-P02-001 | REN-147 | Yes — CONFIRMED, sharper than originally stated (dead config found) |
| RE-F004 (Shop-page sort collapses rank) | KEEP | EPIC-P02-001 | REN-150 | Yes — CONFIRMED, including a misleading code comment |
| RE-F006 (copy half — misleading recommendation copy) | KEEP, ships now | EPIC-P02-001 | REN-157 | Yes — CONFIRMED identical single-item function on both surfaces |
| RE-F006 (signal half — no real co-occurrence signal) | DEFERRED — gated on business need | EPIC-P02-001 | REN-168 | Confirmed absent (no co-occurrence logic exists); deferred status upheld |
| PF-F006 (Recommendation computation never cached) | KEEP | EPIC-P02-001 | REN-160 | Yes — CONFIRMED, including which cache layer already exists nearby |
| RE-F007 (No post-purchase recommendation surface) | VERIFICATION — PROBABLE confidence only | EPIC-P02-001 | REN-165 | Confirmed no such surface exists in code; verification question unresolved (out of this pass's ability to resolve) |
| RE-F008 (Recently-viewed browser-local only) | NO-ACTION — no demonstrated harm | — | Not tracked | Out of scope per orchestrator instruction; not re-investigated |

## Portfolio-level cross-references

- `../../02-epics/EPIC_MAP.md` — EPIC-P02-001 entry, lines describing evidence and shared-microservice risk.
- `../../DEPENDENCY_GRAPH.md` — P01↔P02 shared-infrastructure edge; P08→P02 and P02→P06 edges.
