# Program Overview — ENH (Renivet Enhancement & Improvements)

## What this program is

A documentation-layer reconciliation of Renivet's existing audits, research, QA program, and Linear backlog into one traceable structure: business outcome → Epic → (Story, where real) → Engineering Issue → Task → Test. It does not create new work — it organizes and traces work that already exists, and names the real gaps found while doing so.

## What actually exists (summary — see linked documents for detail)

- **1 Linear team** (Renivet/REN), **4 Linear projects**, **~170 issues**, no native Epic/Initiative primitive in use — `../LINEAR_AGILE_MODEL.md`.
- **5 formalized Epics** with real evidence (P01 Search, P02 Recommendations, P05 Customer Journey, P06 Measurement, P08 Brand Integration) and **3 explicitly not formalized** (P03 Catalog, P04 Merchandising, P07 ML/AI — thin or no evidence) — `../02-epics/EPIC_MAP.md`.
- **4 audit programs** (ecommerce-intelligence, root security audit, infrastructure/staging, growth/marketing) plus **1 self-frozen production-safety QA engagement** with 5 P0 gate items, 4 of which have no Linear coverage — `../04-audits/`, `../08-risks/PORTFOLIO_RISK_REGISTER.md`.
- **1 complete, unimplemented research program** (P08) with zero Linear tracking — `../03-research/`.
- **2 independent governance systems** (per-issue SPEC→REVIEW→TEST, and the `qa/` audit engagement) that don't cross-reference each other — `../09-governance/`.

## Program boundaries (repeated from the master prompt, binding on this pass)

Documentation only. No application code, tests, package/lock files, CI/CD, Vercel, database, Redis, or environment changes. No deploys, merges, or application commits. No GitHub push. **No Linear issues created or modified.** No production changes.

## Where to start reading

1. `../08-risks/PORTFOLIO_RISK_REGISTER.md` — the 4 untracked P0 items, first.
2. `../02-epics/EPIC_MAP.md` — what's real vs. hypothesis.
3. `../01-portfolio/MASTER_REGISTER.md` — everything in one table.
4. `../10-roadmap/EXECUTION_SEQUENCE.md` — what to do about it, in what order.
