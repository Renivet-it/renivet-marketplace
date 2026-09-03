# Execution Sequence

NOW / NEXT / LATER / TRIGGERED / DEFERRED — not a priority sort. Weighs dependencies (`../DEPENDENCY_GRAPH.md`), risk (`../08-risks/PORTFOLIO_RISK_REGISTER.md`), customer/business impact, readiness, complexity, and measurement readiness, per program rule (§29).

## NOW

Independent of each other, all can start immediately, all urgent-severity, none blocked on anything else in this program:

1. **Create Linear issues for DEF-009, DEF-010, DEF-003, DEF-002** (or confirm existing coverage this pass's search missed) — the highest-severity untracked items in the whole portfolio. Route through XC-GOV-001's SPEC process at L3 (auth/payments/PII-adjacent, per `AGILE_PROJECT_LIFECYCLE.md`'s path-rule list).
2. **REN-144** (payment/order integrity) — P0, structural, already fully specified.
3. **REN-145** (Meta Purchase 100x value bug) — P0, corrupting live ad-spend decisions every day it stays open.
4. **REN-136** (Node 20 EOL) — not highest severity, but the only item in the portfolio with a hard external deadline (~4 weeks out at time of writing). Time-sensitivity, not severity, puts it in NOW.
5. **Formally sign off REN-143 Phase A evidence** (fill in Deployments section, Approver field) — cheap, and everything in XC-INFRA-001/STAGING depends on Phase A actually being verified, not just drafted.
6. **Verify REN-93/94's "Deployed to Prod" fixes actually closed the gaps** — a real Linear status, but not independently re-confirmed by this pass; cheap to verify, expensive to be wrong about (finance data / logistics endpoints).

## NEXT

Depends on or is unblocked by NOW items completing, or is the next-highest-leverage independent item:

- **REN-146** (harden shared external ML/search microservice) — highest-leverage single fix in P01/P02 because it's shared infrastructure (`DEPENDENCY_GRAPH.md`); unblocks REN-167's data-gated deferral.
- **REN-95** (checkout login wall, 3-layer fix) — largest single-issue effort in the portfolio; already the pilot subject of the SPEC governance tooling, currently `BLOCKED` on 6 real product/security/finance decisions that need a human owner (`07-decisions/`) before implementation can start. Start the decision process now so implementation isn't blocked later.
- **The residual 5th hardcoded-Delhivery-URL site** (found by REN-143's own investigation, not yet a distinct issue) — small, but leaves a "Done" issue (REN-115) actually incomplete until closed.
- **REN-147** (recommendation fallback hits same host as primary) — fix before any further P02 work, since it's a silent-failure risk on the whole recommendation surface.
- **REN-152** (consolidate duplicate checkout implementations) — the anti-overengineering, debt-reduction move that also closes the CJ-F001 data-loss bug.

## LATER

Real, evidenced, not urgent, not blocking anything else:

- REN-148/149/151/154/155/156/158/159 (P01 remaining backlog)
- REN-150/157/160/162/163 (P02/P05 remaining backlog)
- REN-102/103/104/105/107 (XC-DEBT-001 — tech-debt/hygiene, low severity individually)
- REN-138/139/140/141 (XC-INFRA-001 remaining reliability items — real, e.g. REN-139's DB pool regression has confirmed customer-facing impact, but none carry REN-136's external deadline)
- REN-124/125/126/127 (Automated Testing Rollout's compliance-mapping and CI-workflow milestones — real, methodical, not time-pressured)

## TRIGGERED (do not schedule until the named trigger fires)

- **P08 Phase 1** (File-First + minimal provenance) — not triggered by a date; triggered by a Renivet decision to greenlight the POC (`docs/research/brand-commerce-integration/16-final/POC_PLAN.md`) and convert it into real Linear issues. Currently zero Linear tracking — this program does not create that tracking unilaterally (§33: no Linear issues created).
- **REN-167** (typo-tolerant search fallback) — triggered by REN-146 shipping and producing fallback-activation-rate data.
- **REN-168** (genuine basket co-occurrence signal) — triggered by demonstrated business need, not by any engineering readiness signal.
- **REN-165** (post-purchase recommendation surface) — triggered by resolving its own VERIFICATION status first (is there really no surface today, and is adding one worth the cost relative to the rest of this backlog).
- **REN-166** (GA4 e-commerce events) — triggered by a product decision on whether GA4 is needed as a revenue-reporting source at all (growth-audit already shows GA4 e-commerce columns are currently all zero).
- **P08 Phase 2 components** (generalized API tier, Scheduled-File, full reconciliation spine, SKU-matching auto-apply) — each has its own named trigger in `docs/research/brand-commerce-integration/16-final/RECOMMENDED_ARCHITECTURE.md`; not restated here.
- **P03/P04/P07 formalization** — triggered by real evidence accumulating past the current thin state, per `02-epics/EPIC_MAP.md`'s NOT YET FORMALIZED entries.

## DEFERRED (explicit no-action, with reason)

- **RE-F008** (recently-viewed browser-local only) — QC disposition NO-ACTION, no demonstrated harm.
- **CJ-F007** (dead guest-checkout design file) — NO-ACTION, folded into hygiene bundle REN-107, not independently actionable.
- **REN-117/118/119** — pending confirmation of whether REN-143's own DEP-002/003 resolution superseded their purpose (see `08-risks/PORTFOLIO_RISK_REGISTER.md`); do not schedule work against them until that's confirmed one way or the other.

## Why this is not a simple priority sort

REN-136 (Node 20 EOL) is not the most severe finding in the portfolio, but it's the only one with an external hard deadline — it's in NOW because of time-sensitivity, not severity ranking. Conversely, REN-95 (largest single-issue effort) is NEXT rather than NOW specifically because its real blocker is a set of unmade product/security/finance decisions, not engineering capacity — starting the decision process is the actual unblocking action, not starting the code.
