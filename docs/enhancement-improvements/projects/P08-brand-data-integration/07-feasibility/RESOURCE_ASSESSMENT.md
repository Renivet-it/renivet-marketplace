# Resource Assessment — P08

## Engineering cost (V1)

Per `13-option-comparison/OPTION_C_HYBRID.md` and `14-critic/ANTI_OVERENGINEERING.md`: schema migration (a few columns), a small import-log/import-batch/import-record table set, extending an existing client-side importer, and two well-bounded AI use cases — described in source as "days, not a quarter." The F10 fix is separately "low cost — one ownership check per procedure." No large new engineering org or dedicated team is implied by V1 scope.

## Staffing gap (real, currently unresolved — not an engineering cost, an operating-model decision)

`10-performance-cost-reliability/OPERATIONAL_MODEL.md` and `09-brand-onboarding/SELF_SERVICE.md` both independently flag: nobody currently owns manual-mapping escalation or review-queue triage, and at current ~50-brand/single-integration scale this does not yet justify dedicated headcount — but File-First running at real volume is precisely the scenario that changes that calculus. `SELF_SERVICE.md` characterizes the current escalation path (informally, brand complaints handled reactively) as "a dead end dressed up as a feature" without a defined owner or SLA. This is named explicitly in `01-research/EVIDENCE_INDEX.md` as an UNKNOWN Renivet must resolve directly (a staffing/ownership decision), not something more research or more engineering can resolve.

## Brand-side cost

File-First is the lowest-brand-effort tier in the comparison matrix — a brand needs only the ability to produce a spreadsheet export, something even the most technically unsophisticated brand (Priya persona) already has. No new brand-side infrastructure, credentials, or technical integration work is required for V1.

## Cost NOT being paid in V1 (explicitly deferred, not free later)

Generalized API-connector abstraction, scheduled-file polling infrastructure, the full reconciliation/confidence-review spine (audit-sampling job, review-queue dashboards), and `brand_external_identifiers` are real, front-loaded engineering costs correctly not being paid yet (`13-option-comparison/OPTION_C_HYBRID.md`). This is not "these are free" — it's "the evidence to justify paying them doesn't exist yet" (see `10-roadmap/VERSION_TRIGGERS.md`).

## AI operating cost (V1)

Bounded by design: schema-mapping AI calls occur once per never-before-seen column per brand (not per row, not per sync); attribute-normalization AI calls occur once per distinct unresolved value per batch, trending toward zero as the per-brand lookup table self-improves. Named cheapest tier in research: Claude Haiku 4.5 class pricing, batch-mode discounted. No dedicated GPU/inference infrastructure is implied — this rides on standard hosted LLM API calls.

## Resourcing recommendation

V1 is resourceable within normal feature-team capacity (no new team required). The staffing gap above should be raised as a business decision to Renivet leadership before or alongside V1 shipping, not treated as an engineering blocker — see `99-final/OPEN_DECISIONS.md`.
