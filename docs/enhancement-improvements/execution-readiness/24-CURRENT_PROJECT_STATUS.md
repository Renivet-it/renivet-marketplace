# Gate — Fresh Portfolio Snapshot, All Linear Projects (2026-08-31)

## Reconciliation note: two unrelated "project" structures coexist

This workspace has **two structurally different notions of "project"** that this pass is careful not to conflate:

1. **Formal Linear Projects** (4 total, all under team `Renivet`): `Customer Tracking & Analytics Instrumentation`, `Automated Testing Rollout`, `Guest Journey QA Findings`, `Security & Compliance Audit`. These group real, live Linear issues.
2. **Documentation-only Epics** (`docs/enhancement-improvements/projects/P01-search-ranking`, `P02-...`, `P05-customer-journey`, `P06-...`, `P08-brand-data-integration`): planning/SRS packages on disk. **None of these has a corresponding Linear Project.** Their constituent issues (REN-144, REN-146/147/151/160, REN-131/133, etc.) exist as plain Linear issues, several of which happen to sit inside one of the 4 *formal* Linear Projects above (e.g. REN-131/133 are filed under "Customer Tracking & Analytics Instrumentation"), while others (REN-144, REN-146/147/151/160) have no Linear Project assigned at all.

This is not a gap this pass is authorized to fix (§4 of the governing instructions: "DO NOT create new Projects/Epics just to make the hierarchy look cleaner") — it is reported as-is.

## Formal Linear Projects

| Project | Purpose | Issues | Open P0/P1 | Deployed/Done | Backlog/Todo | Recommendation |
|---|---|---|---|---|---|---|
| **Customer Tracking & Analytics Instrumentation** | Fix PostHog identity-linking and event-instrumentation gaps found while building a growth diagnostic | 7 (REN-128–134) | None currently open (REN-128 Urgent already Deployed) | 5 Deployed to Prod | REN-133 (Medium), REN-134 (Low) | Active, healthy. Note: REN-131's shipped implementation now needs a follow-up patch per REN-144's SPEC (REQ-008) — not yet a separate tracked item; flag if the team wants it broken out. |
| **Automated Testing Rollout** | Stand up agent-browser automated testing against a safety-gated staging environment, mapped to OWASP ASVS L2 / IDOR / SOC 2 | 16 (REN-113–127, 143) | REN-124 (High, IDOR test matrix, Backlog), REN-117 (High, sandbox credentials, Todo) | 10 Deployed to Prod, 1 Done | REN-118, 121, 125, 126, 127 (Medium/Low, Backlog) | Active. REN-143's "Deployed to Prod" label still contradicts its own work-item evidence file (§`05-COMPLETION_EVIDENCE_RECONCILIATION.md`) — unresolved from the prior pass, not re-litigated here. |
| **Guest Journey QA Findings** | UX/correctness bugs found mapping guest-only journeys on production | 5 (REN-108–112) | None open | 4 Deployed to Prod | REN-112 (Low, Backlog — needs a business call on whether the copy variance is intentional) | Nearly complete, low-priority tail only. |
| **Security & Compliance Audit** | Findings from the ongoing internal engineering security/compliance audit (`AUDIT.md`) | 19 (REN-92–107, plus **REN-171, REN-172** created this pass) | **REN-171 (Urgent, NEW), REN-172 (Urgent, NEW)**, REN-95 (High, Todo), REN-101 (High, Backlog) | 10 Deployed to Prod | REN-102, 103, 107 (debt items) | This is now the portfolio's most urgent active project — 2 new P0s just added, plus REN-95's own re-run still pending (see `16-REMAINING_BLOCKERS.md`, unchanged). |

## Documentation-only Epics (no Linear Project; issues tracked individually)

| Epic | Status per prior gates (re-confirmed unchanged this pass, see `21-`) | Key issues | Dependency/Recommendation |
|---|---|---|---|
| P01 — Search Ranking | Ready, unconditional | REN-146 (first), REN-151, REN-147, REN-160, REN-148, REN-149, REN-150, REN-155, REN-156, REN-167, REN-168 | Start immediately; sequence per Gate D (`04-P01_P02_SHARED_CHANGE_PLAN.md`) |
| P02 — Recommendations | Ready, unconditional | Shares REN-146/147/151/160 with P01 | Same file-sequencing note as P01 |
| P05 — Customer Journey | Ready with one exception (REN-144) | REN-144 (P0, unimplemented), REN-95 (decisions lost, needs re-run), REN-153, REN-161, REN-163, REN-165 | REN-144 is the portfolio's first engineering action (unchanged from `20-FINAL_READINESS_DECISION.md`) |
| P06 — Measurement | Ready with one exception (sequencing) | REN-131 (**now shipped** — see `21-`), REN-133 (do not start until REN-131's REN-144 interaction is resolved) | Sequencing note materially changed this pass — REN-131 already shipped ahead of REN-144, inheriting the exact risk Gate B warned about; see `21-LIVE_REMOTE_LINEAR_RECONCILIATION.md` |
| P08 — Brand Data & Commerce Integration | Not authorized for implementation (Gate F, unchanged) | F10 → now closed via **REN-172** (this pass); C1–C8/C10 remain uncreated pending leadership authorization | No change — still authorization-pending, still correctly not started |

## Duplicates discovered
None. No duplicate Linear issue was found or created this pass (see `22-P0_CREATION_RESULT.md`'s duplicate-search log).

## Missing tracking discovered
DEF-009/010/002/003 — resolved this pass (REN-171–174 created). No other untracked P0-equivalent findings were discovered during this session's re-verification.

## Changes from the 2026-08-30 portfolio state
1. REN-131 shipped (was Backlog, now Deployed to Prod) — ahead of REN-144, contrary to the recommended sequence, and confirmed to carry the predicted analytics-overstatement defect into production now, not just as a future risk.
2. REN-171, REN-172, REN-173, REN-174 created (were untracked).
3. `/SPEC` opened for REN-144 (state: CRITIQUE, one blocking open decision) and REN-172 (state: CRITIQUE, one non-blocking open decision) — see `23-SPEC_START_RESULT.md`.
4. No other portfolio state changed — REN-143's evidence gap, REN-95's lost decisions, P08's authorization status, and P01/P02's sequencing recommendation are all unchanged from the prior pass.
