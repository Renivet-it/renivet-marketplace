# Performance — P08

## Existing Unicommerce sync (unchanged in V1 beyond F10 fix)

The cron sync is a single synchronous handler; brands are processed strictly sequentially with zero parallelism; each per-brand transaction pins one DB connection for its duration. **ESTIMATE, not measured**: 50 brands × 2,000 SKUs ≈ 50-150s for a common hourly run; worst case (full resync or rate-limit storm) scales to tens of minutes with no time budget or early exit. No `maxDuration` override was found in the research pass, so a long run risks a silent mid-loop serverless timeout that truncates brand coverage with no distinguishing error. (Research: `10-performance-cost-reliability/`.)

This is a known current-state risk, **not addressed by V1** (V1 does not modify the Unicommerce sync's core execution model, only its access-control procedures per F10). It is named here so it isn't mistaken for something this Epic already fixed.

## File-First ingestion (V1, new)

No hard performance target is measured or set by the research — freshness is explicitly manual-cadence (brand-triggered upload), not a background job, so classic "sync SLA" framing doesn't apply the same way (NFR-5). The practical performance question for V1 is interactive: how long a brand operator waits for parse → map → validate → dry-run-diff generation after uploading a file. No specific number is set by research; this package flags it as an implementation-time sizing exercise against real file sizes (NFR-6), not a pre-researched target — **UNKNOWN**, and appropriately so, since no production volume exists yet to size against.

## AI-assist latency

Named in research: "hundreds of ms to a few seconds" per AI call (schema-mapping or attribute-normalization). Call volume is bounded by design (once per never-before-seen column per brand; once per distinct unresolved value per batch, decreasing over time as lookup tables self-improve) — see `07-feasibility/FEASIBILITY_ASSESSMENT.md`. This should not be a bottleneck at V1's expected volume, but is not independently benchmarked in the research.

## What V1 does NOT need to solve

Real-time or near-real-time freshness for File-First brands — brands needing that freshness are, by the research's evidence, already served by the existing Unicommerce path. Parallelizing the existing cron sync, adding a time budget/early-exit to it, and general retry/backoff infrastructure are all real, named risks but are not V1 scope — they belong with whatever Epic or maintenance work owns the existing Unicommerce sync's operational health, independent of this ingestion-architecture decision.
