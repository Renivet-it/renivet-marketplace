# Observability — P08

## Current state: minimal by design

A single overwritten status/error field per brand; no per-SKU detail; no history (F7). This is the floor V1 must raise, not the ceiling.

## V1 observability floor

- **Per-batch import log** (FR-15): file, brand, rows succeeded/failed, timestamp, resulting row IDs — directly closes F7 for the File-First path.
- **Per-row status and error detail** (`import_records.status`, `.error_detail`) — reuses the existing `productQcFindings` structured-error shape (`code`, `severity`, `field`, `title`, `description`, `suggestion`) rather than inventing a new one.
- **AI-assist audit log** (NFR-7): input, output, confidence, tier, action, human-decision link for every AI-assisted call.
- **Provenance** (`source`/`sourceRecordedAt`) on every written row — this is itself an observability primitive: "what changed and when, from what source" is answerable per-row without engineering help (see USER_STORIES.md's "Renivet ops can see what happened per batch" story).

## What V1 deliberately does not build

No reconciliation dashboard, no audit-sampling surface, no drift-monitoring UI. `05-data/DATA_QUALITY.md` notes that value-format drift is in principle detectable via a spike in the normalization layer's "unmapped value" rate per brand/connector/field over time — V1's design anticipates this signal exists in the data (via the AI-assist audit log and per-row error details) but does not build a dashboard around it. Building that monitoring surface is Phase 2-adjacent tooling, consistent with the anti-overengineering discipline applied throughout (NFR-10).

## Existing Unicommerce sync observability gaps (named, not addressed by V1)

No alerting on sync failure (named in research as the single highest-impact, lowest-cost fix available, independent of this Epic); no sync-attempt history beyond the one overwritten field; no `maxDuration`-aware early exit visibility. These are real gaps but belong to the existing sync's operational maintenance, not to this Epic's File-First scope — flagged here so they are visible, not silently assumed fixed. (Research: `10-performance-cost-reliability/`.)

## Recommendation for what to add first, cheaply, regardless of this Epic's timeline

`10-performance-cost-reliability/OPERATIONAL_MODEL.md` names basic alerting on existing Unicommerce sync failure as the single highest-impact, lowest-cost reliability improvement available today — independent of and cheaper than anything in this Epic's V1 scope. This package repeats that recommendation here because it is a real, low-cost, currently-unactioned item this Epic's research surfaced as a byproduct.
