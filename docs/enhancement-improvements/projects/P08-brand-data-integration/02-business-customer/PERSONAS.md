# Personas — P08

**Classification: all four personas below are INFERRED.** Per the research's own framing (`09-brand-onboarding/PERSONAS.md`): "No claim here describes an actual named Renivet brand." They are generic reasoning plus comparable-marketplace pattern-matching, not a study of Renivet's actual brand roster. Treat them as illustrative of tiers, not as a headcount. The actual brand-tier distribution is UNKNOWN (see `01-research/EVIDENCE_INDEX.md`) and is the single most load-bearing precondition this Epic still needs.

## Priya — spreadsheet-only brand operator

Runs a small brand (~40-150 SKUs), keeps her catalog in a spreadsheet, has near-zero technical skill, and budgets roughly 30-45 minutes to onboard or update her listings. She wants plain-language errors ("this column looks like it might be your size chart — is that right?"), not "validation error: price field null." She is the persona File-First serves directly and is also, per `14-critic/BUSINESS_CRITIQUE.md`, both the largest assumed population and the messiest-data persona — most likely to generate manual-review-queue load.

## Rahul — mid-size brand with an OMS, no Renivet connector

Runs 300-1,500 SKUs through an OMS that has no Unicommerce or Renivet integration. An ops person on his team is comfortable mapping columns/fields manually. He wants the mapping remembered across uploads so he isn't re-mapping the same columns every cycle. He represents the Scheduled-File tier's hypothetical population — a tier this Epic explicitly defers building (see `10-roadmap/VERSION_TRIGGERS.md`) because no named brand today needs it over manual upload at the same cadence.

## Ananya — Unicommerce brand

Runs 500-3,000+ SKUs through Unicommerce, already willing to grant API access. She doesn't want a new ingestion mechanism — she wants the *existing* credential flow wrapped in real mapping/validation/preview UX instead of today's raw, unpersisted API Explorer. She is also the persona most directly exposed by the F10 access-control gap, since she already has live Unicommerce credentials stored against her brand.

## Karan — technical, API-capable brand

Has in-house engineering capacity and wants a documented API contract he can integrate against once, without touching a UI again. He represents the generalized API-First tier's hypothetical population — also explicitly deferred until a second named API-capable brand (beyond the existing Unicommerce case) is actually onboarding.

## Renivet catalog/brand-ops staff (implicit, non-brand persona)

Not modeled as a persona anywhere in the research, but load-bearing: this is the currently-unstaffed role that would own manual-mapping escalation and review-queue triage once File-First runs at real volume. `10-performance-cost-reliability/OPERATIONAL_MODEL.md` and `09-brand-onboarding/SELF_SERVICE.md` both flag this gap; see `07-feasibility/RESOURCE_ASSESSMENT.md`.
