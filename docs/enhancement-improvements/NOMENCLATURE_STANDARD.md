# Nomenclature Standard

Stable IDs for this program's documentation layer. **These IDs do not exist in Linear and this pass creates none there** — they exist only to let this documentation set cross-reference itself and existing Linear/repo artifacts consistently. Existing Linear issue IDs (`REN-###`) are never renamed or reused.

## ID scheme

| Artifact type | ID pattern | Example | Notes |
|---|---|---|---|
| Program | `ENH` | `ENH` | One program: Renivet Enhancement & Improvements. |
| Project | `PXX` | `P08` | Two-digit, zero-padded. See `02-epics/EPIC_MAP.md` for which are formalized vs. hypothesis-only. |
| Epic | `EPIC-PXX-###` | `EPIC-P08-001` | Three-digit sequence within a project. |
| Story / Capability | `STORY-PXX-###` | `STORY-P05-001` | Only created where a real user/business capability exists — see `10. USER STORY DEFINITION` discipline; most current backlog items skip this layer. |
| Engineering issue | *existing Linear ID* | `REN-144` | Never re-numbered. This program references Linear IDs directly, it does not assign parallel IDs to engineering issues. |
| Task / sub-issue | *existing Linear sub-issue ID* | `REN-77` | Same rule — Linear's own `parentId` sub-issues are the task layer where used. |
| Research | `RESEARCH-PXX-###` | `RESEARCH-P08-001` | Maps to a research directory, e.g. `docs/research/brand-commerce-integration/`. |
| POC | `POC-PXX-###` | `POC-P08-001` | Maps to a proposed-not-built POC plan, e.g. `docs/research/brand-commerce-integration/16-final/POC_PLAN.md`. |
| Audit | `AUDIT-PXX-###` or `AUDIT-XC-###` | `AUDIT-XC-001` | `XC` = cross-cutting, for audits not owned by a single PXX (e.g. the ecommerce-intelligence and infra audits span multiple projects). |
| Decision | `DECISION-PXX-###` or `DECISION-XC-###` | `DECISION-XC-001` | For decisions this program surfaces as needing an owner — see `07-decisions/`. Distinct from the repo's own `docs/decisions/` ADR folder (currently empty), which remains the actual ADR promotion target per `09-governance/`. |

## Human-readable naming

Every ID above must always be paired with a short human-readable name in prose and tables — never bare IDs. E.g. "EPIC-P08-001 (Brand Data & Commerce Integration Platform)", not "EPIC-P08-001" alone.

## What this program does NOT rename

- No existing Linear issue, project, or label is renamed.
- No existing repository file, directory, or branch is renamed.
- `docs/.work-items/<LINEAR-ID>/` keeps using bare Linear IDs (`REN-108`, `REN-TEST`) — this program's `RESEARCH-`/`POC-`/`AUDIT-` prefixes are a separate, documentation-only namespace and must never be confused with or substituted into that system's IDs.
