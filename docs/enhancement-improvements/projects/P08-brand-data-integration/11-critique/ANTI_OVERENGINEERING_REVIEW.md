# Anti-Overengineering Review — P08

Carries forward `14-critic/ANTI_OVERENGINEERING.md` directly — this is the research's most load-bearing critique document for scoping V1 correctly, and this package's roadmap (`10-roadmap/`) is a direct translation of its conclusions.

## The four components it evaluated, and why each was deferred (reused verbatim in substance)

1. **Full reconciliation/confidence-review spine** — DEFER; BUILD only the minimal provenance extension. Gate: a second ingestion mechanism actually scheduled, AND the Tier 2 SKU-matching contradiction resolved (it now is, per `05-algorithms/DECISION_LOGIC.md` — but resolving the contradiction meant demoting auto-apply, not enabling the spine).
2. **Generalized API-First** — DEFER. Zero named non-Unicommerce API-capable brand exists; the one existing instance isn't even hardened yet (F10). Don't generalize a connector pattern with only one real instance and a known defect in it.
3. **Scheduled-File** — DEFER, lowest priority of all four, explicitly inverting `HYBRID.md`'s own original build order. "The weakest justification for new engineering of any component in this document" — a convenience gap (brand can already upload manually at the same cadence, zero extra cost), and a new operational surface (a missed scheduled pull with no one watching) that is strictly worse than today's failure mode (a missed manual upload the brand notices immediately).
4. **AI-assisted mapping infrastructure** — split verdict: BUILD schema-mapping + attribute-normalization AI now (low-cost, well-gated); DEFER SKU-matching Tier 1/2 auto-apply (Tier 3/4 suggest-only is fine to build now). This package's `10-roadmap/V1.md`/`V3.md` split reflects this exactly.

## What "minimal provenance extension" concretely means, preserved precisely

`source` column (reusing/widening the existing `inventorySource` enum with one new value, `file_import`) + `sourceRecordedAt` timestamp on every table File-First writes to, plus a minimal per-batch import log (file, brand, rows succeeded/failed, timestamp, resulting row IDs). Framed in source as "days, not a quarter." This package's `06-data/DATA_REQUIREMENTS.md` names the concrete schema shape (import-batch + import-record) that satisfies this framing — a package-level addition, not itself a scope expansion.

## Explicitly excluded scope, preserved

Confidence-tier auto-apply pipeline (Tier 1-4) + audit-sampling job; `brand_external_identifiers` multi-source table (earns its cost only once a brand has 2 concurrent sources); review-queue UI/reconciliation dashboards/audit-sampling surfaces; schema-drift statistical baselining beyond a hardcoded sanity ceiling; webhook/SFTP/iPaaS/GS1 infrastructure.

## Package-level self-check: did this SRS translation itself over-build anything relative to the research?

One area worth flagging honestly: the parent task asked this package to give the RDBMS and AI-feasibility sections "enough depth to stand alone" (`06-data/`, `07-feasibility/FEASIBILITY_ASSESSMENT.md`). The RDBMS comparison in particular (four options, walked through transaction boundaries/idempotency/concurrency/etc.) is more exhaustive than anything the original research wrote on this specific question — the research recommended "minimal provenance extension" at a conceptual level; this package is the first place a concrete schema shape (import-batch + import-record) is chosen and justified in this much detail. This is depth added in service of the parent task's explicit ask, not scope creep in the V1 build itself — the recommended schema shape still implements exactly the same "minimal provenance extension" the research called for, nothing more. Flagged here so a reviewer can distinguish "this package explained the minimal design more thoroughly" from "this package expanded the minimal design."

## Verdict

No component in this package's V1 scope exceeds what `14-critic/ANTI_OVERENGINEERING.md` approved for immediate build. All deferred components retain their original, named, non-date-based triggers (`10-roadmap/VERSION_TRIGGERS.md`).
