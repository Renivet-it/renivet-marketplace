# User Stories — P08

Written from the brand-operator and Renivet-ops perspective, not engineering-shaped. Each story cites the business requirement and research it traces to.

## Dry-run / preview before write

**As a brand operator, I want to preview imported inventory/price/catalog changes (a dry-run diff) before they apply to my live listings, so incorrect source data can't silently corrupt what customers see.**
Traces to: BR-3; Research `06-sync-and-reconciliation/DRY_RUN.md`.

## Explainable mapping failures

**As a brand operator, I want the system to explain why a column or SKU couldn't be automatically mapped, so I can fix it myself without contacting Renivet engineering.**
Traces to: BR-2; Research `09-brand-onboarding/BRAND_EXPERIENCE.md`, `05-identity-and-mapping/SCHEMA_MAPPING.md`.

## Mapping memory across uploads

**As a brand operator who uploads regularly, I want my column mapping remembered from my last upload, so I don't re-map the same fields every time.**
Traces to: BR-2; Research `05-identity-and-mapping/SCHEMA_MAPPING.md` (runtime replay phase, deterministic, no re-prompting).

## Never silently mismatched to the wrong variant

**As a brand operator, I want Renivet to never guess a match between my SKU and an existing product/variant when it isn't certain, so a shirt I sell in three colors never gets the wrong color's price or stock applied.**
Traces to: BR-5; Research `08-ai-opportunities/AI_GUARDRAILS.md`, `15-synthesis/SYNTHESIS.md` §2.

## Plain-language validation errors

**As a spreadsheet-only brand operator (Priya) with no technical background, I want validation errors written in plain language tied to my actual column, not a generic "validation error: field null," so I can fix my file myself.**
Traces to: BR-2; Research `09-brand-onboarding/PERSONAS.md`.

## Schema drift doesn't silently break my sync

**As a brand operator whose export format changes over time, I want Renivet to tell me clearly when a column I used to send is missing or renamed, rather than silently writing nulls over my existing data.**
Traces to: BR-3; Research `05-identity-and-mapping/SCHEMA_DRIFT.md`.

## Partial failure is visible, not all-or-nothing

**As a brand operator uploading a large catalog file, I want to know exactly which rows succeeded and which failed and why, so one bad row doesn't block or hide the rest of my update.**
Traces to: BR-3; Research `06-sync-and-reconciliation/` (Failure Handling); POC failure-scenario list in `10-roadmap/V1.md`.

## Existing Unicommerce brand gets a real mapping/preview experience

**As a brand already on Unicommerce (Ananya), I want the same mapping/validation/preview experience as file-upload brands get, instead of today's raw, unpersisted API Explorer, so I have confidence in what a sync will do before it runs.**
Traces to: BR-1, BR-3; Research `09-brand-onboarding/ONBOARDING_FLOW.md`.

## Confidence that another brand can never see or touch my integration

**As a brand operator with Unicommerce credentials stored in Renivet, I want assurance that no other brand's admin can read, overwrite, or trigger a sync against my integration.**
Traces to: BR-6; Research F10; `11-security-compliance/` S1.

## Renivet ops can see what happened per batch

**As Renivet catalog-ops staff, I want a per-batch import log (file, brand, rows succeeded/failed, timestamp, resulting IDs) so I can answer a brand's "what changed and when" question without engineering help.**
Traces to: BR-4; Research F7; `14-critic/ANTI_OVERENGINEERING.md` (minimal provenance extension).
