# Feasibility Critique — P08

Carries forward `14-critic/BUSINESS_CRITIQUE.md`'s conclusions (the research's own feasibility-adjacent critique) plus this package's own review of the RDBMS/AI feasibility sections it was asked to add depth to.

## Carried forward: is the brand-heterogeneity premise itself validated?

`14-critic/BUSINESS_CRITIQUE.md` Q2 found the premise — that Renivet's brand population is genuinely heterogeneous enough to need tiered ingestion — is "asserted by the brief, echoed by every wave, and never independently verified against Renivet's actual brand roster." The personas are explicitly INFERRED, not drawn from named real brands. This is not fatal (the pattern is industry-corroborated across comparable multi-brand marketplaces), but there is a real difference between "well-corroborated industry pattern, plausibly true" and "Renivet's actual, measured problem." Critically: **the File-First + minimal-provenance slice this package scopes as V1 is justified independent of the brand-tier distribution** — it closes F9 for any number of spreadsheet-only brands, whether that number is 5 or 45. Only the Phase 2 components (Scheduled-File, generalized API-First) rest on an assumption of a meaningful middle/high-capability-tier population.

## Carried forward: is the human-review support burden under-examined?

`14-critic/BUSINESS_CRITIQUE.md` Q4 found yes. At current ~50-brand scale, the burden of running File-First manual-review escalation "does not justify dedicated headcount" per `OPERATIONAL_MODEL.md` — but once File-First runs at meaningful volume, it likely does, and no wave confirms Renivet has or has budgeted for brand-support/catalog-ops staff. This package treats this as a named open decision (`99-final/OPEN_DECISIONS.md`), not a solved problem, and does not claim V1 is fully "feasible" in an operational sense until this staffing question has an answer — engineering feasibility and operational feasibility are scored separately here on purpose.

## Package-level critique: is the RDBMS-design comparison in `06-data/DATA_REQUIREMENTS.md` actually a fair fight?

This package's own addition. Self-assessment: the comparison correctly rejects the event-sourcing model (Option C) for being disproportionate to V1's actual requirements, but it should be read with one caveat — Option C is *precisely* what the deferred reconciliation spine (V2) will eventually want. This package's recommendation is not "event-sourcing is wrong," it's "event-sourcing is premature until the reconciliation trigger fires" — the same anti-overengineering logic applied everywhere else in this package, applied consistently here too. A reader should not conclude Option B is architecturally superior in general, only that it is the right choice for a system with no reconciliation consumer yet.

## Package-level critique: is the AI feasibility walk (DETERMINISTIC → ... → HUMAN REVIEW) genuinely evaluative, or does it just restate the conclusion research already reached?

Partially the latter, honestly. The five-step walk in `07-feasibility/FEASIBILITY_ASSESSMENT.md` is structured to make each use case's reasoning legible, but the underlying verdicts (build schema/attribute AI, defer SKU auto-apply, rules-not-AI for anomaly detection) are all reused directly from `08-ai-opportunities/` and `14-critic/AI_CRITIQUE.md`, not independently re-evaluated by this package. This is intentional per the parent task's instruction to reuse those conclusions rather than re-deriving them — flagged here so the walk isn't mistaken for new evaluative work.

## MCP feasibility critique

The "MCP is not applicable" conclusion in `07-feasibility/FEASIBILITY_ASSESSMENT.md` is this package's own reasoning (the original research program does not address MCP at all, since it predates or was scoped independent of that question). This package's confidence in that conclusion is high given the batch, non-conversational nature of every AI use case in this Epic, but it is worth noting explicitly that no source research document confirms or denies it — this is a package-level judgment, not a translated research finding.
