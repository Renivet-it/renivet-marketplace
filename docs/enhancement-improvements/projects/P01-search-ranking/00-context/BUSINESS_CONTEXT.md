# Business Context — P01 Search & Ranking Intelligence

## Why search matters to Renivet

Search is a primary product-discovery surface on an e-commerce marketplace: every customer who does not browse categories directly, arrives here first. Renivet is a curated multi-brand marketplace (sustainable/ethical goods, per `about-mission-vision.tsx` framing — INFERRED from site content, not a business document) where the catalog spans many small brands rather than one retailer's SKUs, which makes lexical (keyword) matching alone weak — brand names, category names, and product-type vocabulary vary a lot across sellers. This is the business reason the external semantic (RAG) search exists at all: CONFIRMED via `src/lib/db/queries/product.ts` that plain `ILIKE` is only the fallback, not the primary path.

## Business value of this Epic's fixes

None of the ten backlog issues in this Epic add a customer-visible feature. Their value is entirely in **removing latent risk and waste in an already-shipped capability**:

| Issue | Business value |
|---|---|
| REN-146 (timeouts) | Prevents a hung external dependency from silently stalling every search/recommendation request until Vercel's own function timeout kills it — CONFIRMED no request-level timeout exists today. Business cost of the gap: slow or hung searches during any upstream ML-service degradation, with no bound on how long. |
| REN-149 (reconnect redirect) | A customer who searches "Nike" today gets a generic text-matched shop listing instead of being sent straight to the Nike brand page, even though the system already computed that this was a brand match — CONFIRMED, see `05-algorithms/DECISION_LOGIC.md`. Fixing this is a one-line change that improves discovery for zero engineering risk. |
| REN-151 (parallelize) | Shaves one network round-trip off every semantic-search request's latency — direct effect on perceived search speed and (INFERRED) bounce/abandonment on the search results page. |
| REN-154 (click logging) | Prerequisite for ever measuring whether search actually helps customers find what they want — currently impossible; see `08-reliability/OBSERVABILITY.md`. |
| REN-155/156/158/159 | Waste reduction (redundant network calls, non-indexed query overhead, unnecessary re-computation) rather than direct customer value — see `07-feasibility/BUILD_REUSE_BUY_SIMPLIFY.md`. |
| REN-148 | Protects against a slow-building trust problem: if the external search index silently drifts from the live catalog, customers eventually see stale or wrong results with no visible symptom until it's bad — see `08-reliability/FAILURE_MATRIX.md`. |

## What "success" looks like for this Epic

**UNKNOWN / DECISION REQUIRED** — no numeric target (conversion lift, latency SLA, search-to-purchase rate) exists anywhere in the codebase or the prior portfolio-governance pass for this Epic. See `09-validation/SUCCESS_METRICS.md` and `08-reliability/PERFORMANCE.md` for what would need to be instrumented (largely via REN-154) before any target can be set responsibly.

## Stakeholders

**UNKNOWN** — no product owner, business stakeholder, or team roster for search specifically is named in any repository document. See `07-feasibility/RESOURCE_ASSESSMENT.md`.
