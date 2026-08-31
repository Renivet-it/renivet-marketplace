# Epic Map

Reconciles the working hypothesis (P01–P08) against actual evidence: Linear issues/projects, research output, and audit findings gathered in this pass. Per program rule (§8, §33): **do not force fake hierarchy merely to populate fields.** Five of the eight hypothesized projects have real, evidenced work behind them and are formalized as Epics below. Three do not yet — they're recorded as **NOT YET FORMALIZED**, with the specific evidence gap named, rather than invented.

## Formalized Epics

### EPIC-P01-001 — Search & Ranking Intelligence
- **Objective:** Keep Renivet's catalog search (external RAG/ML-backed, with a deterministic ILIKE fallback) fast, correct, and observable.
- **Evidence:** REN-83 (Done — "Optimise Product Search Performance"), REN-146 (harden external ML/search microservice — timeouts, endpoint config), REN-148 (search-index sync cadence), REN-149 (intent-classifier redirect reconnect), REN-151 (parallelize sequential external calls), REN-154 (search click/result-count logging — currently a no-op stub), REN-155 (requireMedia filter applied post-pagination), REN-156 (dead code removal), REN-158 (redundant ILIKE fallback), REN-167 (deferred: typo tolerance, gated on REN-146 data).
- **Linear coverage:** No dedicated Linear Project exists — these are `qa-finding`-labeled issues on the team backlog, plus one standalone Done issue (REN-83). Real, but not yet organized as a Linear Project of its own.
- **Research status:** None dedicated; findings come from the ecommerce-intelligence audit, not a research program.
- **Architecture status:** No target architecture document exists for search specifically — REN-146/148 are hardening fixes to the existing external microservice dependency, not a redesign.
- **Implementation status:** REN-83 shipped; 8 remaining issues in Backlog.
- **Testing status:** No dedicated test coverage found; REN-154 (click/result-count logging) is itself a prerequisite for measuring search quality going forward.
- **Risks:** Single external ML/search microservice is a shared dependency for P01 and P02 both (see `DEPENDENCY_GRAPH.md`) — REN-146 (timeouts/hardening) is the highest-leverage fix precisely because it's shared infrastructure, not because search itself is fragile.
- **Related projects:** P02 (shares the external ML microservice), P08 (produces the catalog data search operates over).
- **V1/V2/V3:** Not formally scoped by this program — the 8 backlog issues are independently actionable fixes, not a phased roadmap. If Renivet wants a phased search roadmap, that's new scoping work this pass doesn't do.

### EPIC-P02-001 — Recommendations & Personalization
- **Objective:** Make Renivet's recommendation surfaces (cart cross-sell, PDP similar-products, shop-page personalized sort) accurately reflect what they claim to do, and degrade safely on failure.
- **Evidence:** REN-147 (cart cross-sell fallback hits the same host as primary — no real redundancy), REN-150 (shop-page sort collapses computed rank into a binary bucket), REN-157 (recommendation copy overclaims "complementary"/"pairs well" when the underlying signal is plain similarity), REN-160 (recommendation computation never cached), REN-165 (verification-only: is a post-purchase recommendation surface worth adding), REN-168 (deferred: genuine basket co-occurrence signal, explicitly gated on demonstrated business need — do not build speculatively).
- **Linear coverage:** No dedicated Linear Project; `qa-finding`-labeled issues on the team backlog.
- **Research status:** None dedicated.
- **Architecture status:** None — current design is "call the shared external similarity service"; no Renivet-owned recommendation model or ranking logic beyond REN-150's shop-sort issue.
- **Implementation status:** All 6 issues in Backlog or Deferred/Verification.
- **Testing status:** None found.
- **Risks:** Same shared-external-microservice dependency as P01 — REN-147's fallback design flaw means a full outage of that one host currently degrades recommendations to nothing, silently.
- **Related projects:** P01 (shared dependency), P08 (recommendation quality depends on catalog data completeness/correctness, which P08 governs).
- **V1/V2/V3:** Not formally scoped. REN-168 is explicitly V2+-shaped already (gated on measured business need) — a good model for how this program's V1/V2/V3 discipline should work elsewhere (see `PORTFOLIO_ANTI_OVERENGINEERING.md`).

### EPIC-P05-001 — Customer Journey & UX
- **Objective:** Make the guest and authenticated purchase journey (browse → cart → checkout → payment → confirmation) correct, honest, and consistent.
- **Evidence:** Linear Project **Guest Journey QA Findings** (REN-108 guest wishlist missing header/footer, REN-109 wrong tab title, REN-110 accessibility gap, REN-111 inconsistent guest-redirect behavior, REN-112 interstitial copy inconsistency) plus checkout/cart findings carrying the `qa-finding`/`security` labels: REN-95 (checkout login wall blocks guest checkout, 3-layer fix — the single largest-effort item in the whole reconciled backlog), REN-144 (payment/order integrity — P0/Urgent, see `08-risks/`), REN-152 (duplicate checkout implementations), REN-153 (cart availability not shown until checkout), REN-161 (undisclosed auto-coupon), REN-163 (payment-cancel redirect).
- **Linear coverage:** Real, dedicated Linear Project (Guest Journey QA Findings) for the guest-journey subset; the checkout/payment subset lives as individually-labeled issues, not yet under the same or a sibling Project.
- **Research status:** None dedicated — findings are audit-derived (ecommerce-intelligence program) and QA-derived (`qa/`, e.g. `POST_ORDER_INVESTIGATION.md`).
- **Architecture status:** None formal. REN-152 (two independently-built checkout implementations) is itself an architecture-consolidation finding, not yet designed.
- **Implementation status:** All 5 Guest Journey issues Backlog; REN-95 Backlog (largest); REN-144 Backlog (P0); REN-152/153/161/163 Backlog.
- **Testing status:** `qa/` (see `09-governance/`) is the source of most findings here, via real (mostly read-only) journey testing, waves 0–2.
- **Risks:** REN-144 (payment/order integrity) is the single highest-severity item under this Epic — see `08-risks/PORTFOLIO_RISK_REGISTER.md`.
- **Related projects:** P06 (checkout/payment events feed measurement), P04-adjacent (TRYNEW20 disclosure touches merchandising, tracked here since it's a UX/trust finding, not a pricing-rules program).
- **V1/V2/V3:** Not formally scoped.

### EPIC-P06-001 — Measurement & Experimentation
- **Objective:** Make Renivet's analytics (PostHog, Meta CAPI/Pixel, GA4) accurately capture what customers actually do, so downstream ad spend and product decisions aren't built on corrupted data.
- **Evidence:** Linear Project **Customer Tracking & Analytics Instrumentation** (REN-128 PostHog identify — shipped, REN-129 PostHog init-delay reassessment — shipped, REN-130 phone-signup tracking — shipped, REN-131 server-side purchase capture, REN-132 add_to_cart/cart_added 4.3x discrepancy, REN-133 duplicate purchase_completed instrumentation, REN-134 misleading server-client file naming) plus `qa-finding`-labeled measurement issues: REN-145 (Meta Purchase event ~100x currency-unit bug — P0/Urgent, the single highest-confidence, highest-impact finding in this whole reconciliation), REN-154/162 (search/product-click logging gaps), REN-164 (verification: PostHog init-timing race), REN-166 (deferred: GA4 e-commerce events, gated on a product decision on whether GA4 is even needed as a revenue source).
- **Linear coverage:** Real, dedicated Linear Project plus adjacent `qa-finding` issues.
- **Research status:** `docs/growth-audits/2026-08-23/` — a real 5-month marketing/analytics data pull (Meta Ads, PostHog, GA4 via Windsor.ai), independently confirming the GA4 e-commerce-events gap REN-166 also flags.
- **Architecture status:** None formal.
- **Implementation status:** 4 of 10 items shipped (REN-128/129/130 + growth-audit corroboration of REN-166's premise); 6 remaining, including the P0 REN-145.
- **Testing status:** None dedicated beyond the audit/growth-audit read-only data pulls.
- **Risks:** REN-145 — see `08-risks/PORTFOLIO_RISK_REGISTER.md`. Ad spend decisions made on the corrupted Meta Purchase-value data are a real, ongoing business cost, not just a data-quality nit.
- **Related projects:** P01 (search logging), P02 (recommendation logging), P05 (checkout/payment events are the source of the P0 finding), P07 (measurement is a stated prerequisite for any future ML/ranking work — see P07's NOT YET FORMALIZED entry below).
- **V1/V2/V3:** Not formally scoped.

### EPIC-P08-001 — Brand Data & Commerce Integration Platform
- **Objective, scope, architecture, POC:** Fully specified — see `03-research/` pointer to `docs/research/brand-commerce-integration/16-final/` (EXECUTIVE_SUMMARY, FINAL_RESEARCH, RECOMMENDED_ARCHITECTURE, POC_PLAN, OPEN_QUESTIONS).
- **Linear coverage:** **None.** Zero Linear issues reference this program — the entire 16-wave research effort (current-state, Unicommerce capability research, alternative architectures, canonical data model, identity/mapping, sync/reconciliation, catalog/media, AI opportunities, brand onboarding, performance/cost/reliability, security/compliance, industry research, option comparison, critic, synthesis, final report) exists only as documentation. This is the most-researched, least-Linear-tracked Epic in the portfolio — a real gap between research maturity and execution tracking.
- **Research status:** Complete (16/16 phases).
- **Architecture status:** Complete — scoped-down Hybrid (File-First + minimal provenance now; generalized API-First, Scheduled-File, full reconciliation spine, SKU-matching auto-apply all explicitly gated behind named triggers, not scheduled).
- **Implementation status:** Not started. Explicitly not authorized by the research program itself (read-only research mandate).
- **Testing status:** N/A — no implementation exists yet. POC failure scenarios are pre-specified (`POC_PLAN.md`).
- **Risks:** A live, HIGH-severity, verified cross-brand access-control gap in the *existing* Unicommerce integration (Wave 0 F10) — independent of the architecture decision, and now confirmed to likely be one instance of the broader DEF-010 cross-tenant bypass found separately by `qa/`'s security audit (see `08-risks/PORTFOLIO_RISK_REGISTER.md`).
- **Related projects:** P01/P02 (consume the catalog data this Epic governs), P03 (see NOT YET FORMALIZED below — P08 is currently the closest thing Renivet has to a catalog-data-foundation Epic).
- **V1/V2/V3:** Explicitly defined in the research (`RECOMMENDED_ARCHITECTURE.md`): Phase 1 = File-First + minimal provenance + schema/attribute AI-assist (build now); Phase 2 = generalized API tier, Scheduled-File, full reconciliation spine, SKU-matching auto-apply (deferred, each with a named concrete trigger, not a date).

## NOT YET FORMALIZED — real evidence gap, not an oversight

### P03 — "Catalog Intelligence"
Thin evidence: REN-155 (requireMedia filter timing), REN-159 (catalog listing cache) — two isolated performance/correctness fixes, not a coherent catalog program. **P08's research is the actual catalog-data foundation work** (canonical product/variant/inventory/price/media model, identity resolution) — until P08's Phase 1 ships and a distinct *consumption-side* catalog need emerges beyond what P01 (search) and P08 (data ingestion) already cover, formalizing a separate P03 Epic would create an artificial third bucket for work that already has a home. Revisit once P08 Phase 1 or a specific catalog-browsing/faceting initiative is proposed.

### P04 — "Merchandising & Business Rules"
Thin evidence: REN-161 (auto-coupon disclosure) is the only finding. One UX/trust issue is not evidence of a merchandising *program* (pricing rules, promotions engine, business-rule configuration). No research, no architecture, no second data point. Do not formalize; track REN-161 under P05 (Customer Journey & UX) where it already fits as a trust/disclosure issue, until real merchandising-program work exists.

### P07 — "Algorithm / ML / AI + MLOps"
Thin evidence: REN-146 (harden the *existing external* ML/search microservice) is the only related item, and it is explicitly a hardening/reliability fix to a third-party dependency Renivet calls, not evidence of Renivet building, training, or operating its own model. No dataset, no offline evaluation, no MLOps pipeline, no owned model exists anywhere in this reconciliation. P08's research (`08-ai-opportunities/`) is the most substantial AI-design thinking in the portfolio, and it explicitly scopes AI as a narrow, human-gated *assistance* layer (schema mapping, attribute normalization), not a P07-style ML program. Do not formalize P07 until Renivet actually commissions ML/algorithm work of its own — see `ML_AI_LIFECYCLE.md` for why applying a full ML lifecycle to REN-146-style hardening work would be overengineering.

## Cross-cutting (deliberately outside P01–P08)

Infrastructure/Vercel/staging, Security & Compliance, the `qa/` production-safety program, and the engineering-governance tooling (SPEC→REVIEW→TEST) are real, substantial, and evidenced — but per program rule (§15) they are cross-cutting engineering streams, not product Epics, and are not force-fit into P01–P08. See `04-audits/`, `08-risks/`, and `09-governance/`.
