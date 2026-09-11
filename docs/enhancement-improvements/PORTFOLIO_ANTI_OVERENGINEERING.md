# Portfolio Anti-Overengineering

Applies the program's checklist (§24) against actual portfolio evidence — not a generic checklist, a set of real findings from this reconciliation.

## Duplicate infrastructure

**Found: two independent governance systems that don't cross-reference each other.** `docs/.work-items/` (SPEC→REVIEW→TEST, per-issue) and `qa/` (production-safety audit engagement) both exist, both real, but neither references the other despite overlapping subject matter (both, for instance, touch payment/order integrity). This isn't wasted build effort — they serve genuinely different purposes (per-issue contract vs. broad audit) — but the lack of cross-reference is a real gap `09-governance/` should close, not a case for merging them into one system.

## Duplicate AI services

**None found.** Only one AI-assist design exists in the whole portfolio (P08's, not yet built) and one third-party ML dependency (the external search/recommendation microservice). No duplication risk today — see `AI_GOVERNANCE.md` principle 8 for keeping it that way as new Epics propose AI use cases.

## Duplicate event systems

**Found, real: two independent checkout implementations** (REN-152) with duplicated business logic, one of which has a confirmed data-loss bug (customization requests silently dropped) the other doesn't share. This is exactly the kind of duplication this gate exists to catch — not speculative, already root-caused, already in `AUDIT_TO_BACKLOG_TRACEABILITY.md`.

## Duplicate recommendation engines

**None found** — one recommendation surface (the external similarity service), called from two UI locations (cart cross-sell, PDP similar-products) with shared logic, not duplicated logic. REN-157's finding is about mismatched *copy* (implying two different capabilities), not mismatched *code*.

## Unnecessary microservices / premature APIs / premature real-time systems

**Directly answered by P08's own anti-overengineering pass** (`docs/research/brand-commerce-integration/14-critic/ANTI_OVERENGINEERING.md`) — reused here as the model for the rest of the portfolio: generalized API-First tier DEFERRED (zero named second brand needing it), Scheduled-File tier DEFERRED (has a zero-cost substitute — manual upload — today), full reconciliation spine DEFERRED (unmeasured demand). No other Epic in the portfolio proposes new infrastructure of comparable weight to evaluate.

## Competitor-driven features

**None found in this reconciliation** — every P01/P02/P05/P06 finding traces to a real, evidenced defect or gap in Renivet's own system (audit/QA findings), not to matching a competitor's feature. P08's research explicitly rejected "replicate Unicommerce" framing in favor of "solve Renivet's actual integration problem" — the one place a competitor-mirroring temptation existed, and it was already correctly resisted.

## Unnecessary vector DB / feature stores

**None proposed anywhere in the portfolio.** P08's research flags `pg_trgm` availability and the existing `products.embeddings`/`semanticSearchEmbeddings` columns as **UNKNOWN/unconfirmed fitness** for identity matching — the open question is whether the *existing* embedding infrastructure is even being used correctly, not whether to add more. No Epic proposes a new vector DB or feature store. Correct default; no action needed.

## Can an existing capability serve this project?

Applied per-Epic:

- **P01/P02 (search/recommendations):** yes — REN-146/148/151/158/159 are all about correctly using and hardening the *existing* external ML service and *existing* Postgres/cache capability, not adding new systems.
- **P05 (customer journey):** yes — REN-144's fix is a transaction boundary and reconciliation logic using the existing DB, not new infrastructure. REN-152's fix is consolidation (removing duplication), the anti-overengineering direction by definition.
- **P06 (measurement):** yes — REN-145's fix is a unit-conversion bug fix and event-firing-cadence fix in the existing Meta CAPI integration, not a new analytics platform. REN-166 (GA4 e-commerce events) is explicitly gated on a product decision on whether GA4 is even needed as a second revenue-reporting source — correctly not building it speculatively.
- **P08 (brand integration):** yes, extensively — the entire Phase 1 recommendation is "generalize the existing `products.inventorySource` provenance pattern" and "extend the existing `product-import.tsx` client-side importer," explicitly rejecting new infrastructure in favor of existing capability, per its own critic pass.
- **XC-INFRA-001 (staging):** yes — the entire staging fix (REN-143) is "use Vercel's existing free Preview Deployments feature correctly" (Model B), explicitly **zero new infrastructure**, rejecting more elaborate staging architectures that were considered.

## Verdict

This portfolio's real overengineering risk is not speculative new systems — none were found being proposed — it is **process debt**: two non-cross-referenced governance systems, and a security-audit program (`qa/`) that found systemic findings (DEF-009/010) not yet connected to the Linear backlog that's supposed to track and close them. The fix for both is reconciliation work (this program), not new tooling.
