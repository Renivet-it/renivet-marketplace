# Linear ↔ Agile Model

What actually exists in Renivet's Linear workspace (read-only inspection, 2026-08-29), and how the program's conceptual Agile hierarchy maps onto it. This is the ground truth the rest of this program's documents build on — do not assume a richer Linear model than what's here.

## What exists in the workspace

- **Workspace:** Renivet (`linear.app/renivet`)
- **Teams:** exactly one — `Renivet` (key `REN`)
- **Projects:** exactly four, all under the one team, all currently status `Backlog` (project-level status, distinct from issue-level status), all `priority: No priority`, none with a `startDate`/`targetDate` set:
  - Customer Tracking & Analytics Instrumentation
  - Automated Testing Rollout
  - Guest Journey QA Findings
  - Security & Compliance Audit
- **Initiatives:** none found. Linear's Initiative primitive (a grouping above Project) exists as a concept in the API but no initiative object is populated in this workspace — every project sits directly under the one team.
- **Epics:** no native "Epic" object in this Linear plan/workspace. There is no primitive between Project and Issue.
- **Issues:** ~170 (`REN-1` through `REN-170` as of this pass), flat under Team/Project, with occasional parent/child structure via `parentId` (e.g., `REN-77` is a child of `REN-75`; `REN-10` is a child of `REN-7`). This is Linear's native sub-issue mechanism — used sparingly, not as a standard practice.
- **Milestones:** exist under at least one project (`Automated Testing Rollout` has milestones "Staging Readiness", "Journey Mapping & Automated Suite", "IDOR Test Matrix", "Compliance Mapping (ASVS/SOC2)" — seen via `projectMilestone` on issues like REN-115, REN-122, REN-123, REN-126). Not inspected exhaustively for every project.
- **Cycles:** not inspected — no evidence any issue in this pass carried a cycle assignment.
- **Labels:** 9 workspace labels: `staging-readiness`, `qa-finding`, `tech-debt`, `security`, `Doc`, `sos`, `Feature`, `Improvement`, `Bug`.
- **Statuses:** 8, team-scoped: `Backlog`, `Todo`, `In Progress`, `Deployed to Staging`, `Deployed to Prod`, `Done`, `Canceled`, `Duplicate`. Note `Deployed to Staging`/`Deployed to Prod` are custom `started`-type statuses specific to this team — not Linear defaults — meaning "In Progress" and "Deployed" are treated as distinct, real signal, not just decoration.
- **Priority:** Linear's standard 5-value scale (`0=No priority, 1=Urgent, 2=High, 3=Medium, 4=Low`), used inconsistently — most QA-derived issues (REN-108 onward) carry a priority; most of the early product/marketing issues (REN-1–90) don't.

## Mapping the intended Agile hierarchy onto the actual model

| Conceptual layer | Linear primitive used | Notes |
|---|---|---|
| **Program** (ENH) | Not a Linear object — exists only in this documentation set | Linear has no primitive above Initiative, and no Initiative is populated. The Program is a documentation-layer concept only. |
| **Project (P01–P08)** | **Linear Project**, where one already exists and is evidenced; otherwise a documentation-only grouping until real work exists to justify creating one | Do not create Linear Projects for P01–P08 speculatively — see `02-epics/EPIC_MAP.md` for which are real today. |
| **Epic** | No native primitive — represented as **a Linear Project** (where the project's actual issue population is coherent and epic-sized, e.g. "Security & Compliance Audit") **or as a documentation-only Epic entry** referencing a set of issues that don't yet have a dedicated Linear Project | Do not invent a "parent issue as Epic" pattern — this workspace doesn't use parent issues that way (its two observed parent/child pairs are ordinary task breakdowns, not epic groupings). |
| **User Story / Capability** | **Linear Issue**, where the issue is genuinely capability-shaped (rare in this workspace today — most issues are already engineering-issue-shaped, not story-shaped) | See `10. USER STORY DEFINITION` guidance — most of Renivet's current backlog skips this layer entirely and goes straight from finding to engineering issue, which is appropriate for a QA-finding-driven backlog and should not be retrofitted with synthetic stories. |
| **Engineering Issue** | **Linear Issue** (the dominant real usage pattern in this workspace) | This is what ~95% of REN-### issues actually are. |
| **Task / Sub-issue** | **Linear sub-issue** (`parentId`), used rarely today | Available and correct for breaking down a large engineering issue; not a required layer. |
| **Test / Validation** | **Not a Linear object** — lives in `docs/.work-items/<ID>/` (SPEC → REVIEW → TEST artifacts) and, separately, in `qa/` (the production-safety audit engagement) | Do not create a Linear "Test" issue type — the existing governance system already produces this evidence outside Linear, per `09-governance/`. |

## Key implication for this program

Renivet's Linear usage is **flat and issue-driven**, not epic-structured — the 4 existing Projects are themselves closer to ad hoc audit/workstream groupings than durable strategic Epics, and 3 of the 4 map cleanly onto specific audit programs already inventoried (`04-audits/`). The formal PROGRAM → EPIC → STORY → ISSUE → TASK hierarchy this initiative wants to establish does **not** yet exist as Linear structure and should not be forced into Linear objects that don't fit it. Per program rule (§6, §33): **no Linear issues, projects, or labels are created or modified by this pass.** Where `02-epics/EPIC_MAP.md` proposes formal Epics, they are documentation-layer constructs that *reference* existing Linear Projects/Issues, not new Linear objects.

## Recommendation, not yet actioned

If Renivet later wants Epics to be a first-class Linear object rather than a documentation-layer concept, the two realistic paths are (a) start using Linear Initiatives (currently unused, would sit above the existing 4 Projects) or (b) continue the current pattern of one Linear Project per coherent audit/workstream. This program does not choose between them — it's a Linear-configuration decision for whoever owns the workspace, out of scope for a read-only documentation pass.
