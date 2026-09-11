# Dependency Graph

Validates the master prompt's hypothesized dependency pattern (§16, §30) against actual evidence gathered in this pass. Each hypothesized edge is either **CONFIRMED** (real evidence), **PARTIAL** (real but weaker/different than hypothesized), or **NOT EVIDENCED** (no supporting finding, often because the upstream project itself isn't formalized — see `02-epics/EPIC_MAP.md`).

## Validated graph

```
EPIC-P08-001 (Brand Data Integration)
   |
   |  provides canonical product/variant/inventory/price/media data
   v
EPIC-P01-001 (Search)  <---- shared external ML/search microservice ----> EPIC-P02-001 (Recommendations)
   |                                                                            |
   |  emits search events (REN-154)                     emits reco events (REN-160/165)
   v                                                                            v
              EPIC-P06-001 (Measurement & Experimentation)
                            ^
                            |  emits checkout/payment events (REN-144/145's root path)
                            |
              EPIC-P05-001 (Customer Journey & UX)

XC-INFRA-001, XC-SEC-001, XC-QA-001, XC-GOV-001, XC-DEBT-001 — cross-cutting, feed constraints into all of the above (staging safety to test against, security fixes, governance process, tech-debt drag) but are not product-outcome dependencies themselves.
```

## Edge-by-edge validation

| Hypothesized edge | Verdict | Evidence |
|---|---|---|
| P08 → P03 → P01 | **PARTIAL, restructured** | P03 isn't formalized (`02-epics/EPIC_MAP.md`) — the real dependency is direct: **P08 → P01**. P08's canonical catalog/media model is what P01's search operates over (e.g., REN-155's `requireMedia` filter is a catalog-completeness issue P08's media model addresses). |
| P03 → P02 | **PARTIAL, restructured** | Same restructuring: **P08 → P02** directly. Recommendation quality depends on catalog data completeness (e.g., RE-F008's "recently-viewed" gap and RE-F006's copy-accuracy issue both trace back to what catalog/product data is actually available to the similarity service). |
| P06 → P01 | **CONFIRMED** | REN-154 (search click/result-count logging is currently a no-op stub) is a direct, named P01→P06 data dependency: P06 cannot measure search quality until P01 ships real event emission. |
| P06 → P02 | **CONFIRMED** | REN-160/165 (recommendation caching, post-purchase surface verification) similarly depend on P02 emitting measurable events P06 can consume. |
| P06 → P07 | **NOT EVIDENCED** | P07 isn't formalized (no owned model/dataset/pipeline exists) — there is nothing for P06 to feed yet. This edge is premature; revisit only if P07 is ever formalized. |
| P01 → P02 | **PARTIAL, restructured as shared dependency, not a directional edge** | Both P01 and P02 depend on the same external ML/search microservice (REN-146's hardening fix benefits both equally) — this is a shared-infrastructure relationship, not P01 producing something P02 consumes. Drawn as a bidirectional shared-dependency edge above, not P01→P02. |
| P04 → P01 | **NOT EVIDENCED** | P04 isn't formalized (one finding, REN-161, tracked under P05 instead). No edge. |
| P04 → P02 | **NOT EVIDENCED** | Same reason. |
| P05 → P01/P02/P04 | **NOT EVIDENCED as stated; real relationship is the reverse** | No finding shows P05 (customer journey/checkout) depending on P01 (search) or P02 (recommendations) — they're independent surfaces a customer passes through, not a pipeline. The real, evidenced edge is **P05 → P06**: checkout/payment events (REN-144's root path, REN-145's Meta Purchase event) are what P06 measures. Drawn above as P05 → P06. |

## What this means for sequencing

The one **strong, multi-source-confirmed** cross-project dependency in the portfolio is **P08 → P01/P02** (catalog data quality gates search/recommendation quality) and **P05 → P06** (checkout/payment event correctness gates measurement accuracy). Neither P03, P04, nor P07 contribute real edges today because none are formalized Epics yet. This should directly inform `10-roadmap/EXECUTION_SEQUENCE.md` — it argues for P08's Phase 1 and P05/P06's two P0 items (REN-144, REN-145) as the true dependency-driven priorities, independent of any priority field in Linear.

## Cross-cutting constraints (not dependency edges, but real gates)

- **XC-INFRA-001** (staging) gates how safely any of P01/P02/P05/P08 work can be tested before shipping — REN-143's Phase A evidence being unsigned is a real, if soft, blocker on trustworthy staging validation for everything else.
- **XC-SEC-001** (security), especially the untracked DEF-009/DEF-010 (see `08-risks/PORTFOLIO_RISK_REGISTER.md`), is a platform-wide risk that touches every Epic's brand-facing and customer-facing surfaces, not just one project.
- **XC-GOV-001** (SPEC→REVIEW→TEST tooling) is the mechanism every Epic's engineering issues should flow through once implementation starts — see `09-governance/`.
