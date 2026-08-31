# Portfolio Risk Register

Ranked by severity, not by which Epic they sit under. Per program rule (§31): urgent engineering remediation proceeds in parallel with the portfolio sequence — none of the items below should wait on this program's roadmap work.

## P0 — untracked in Linear, flagged directly to the user 2026-08-29

Five items in `qa/RELEASE_GATE.md` are named as release-blocking and must each reach `INDEPENDENTLY VERIFIED` status before the `qa/` program's Wave 3+ can resume. Cross-referencing against all ~170 Linear issues (direct queries, this pass) found matches for only one of the five:

| ID | Finding | Linear match | Status |
|---|---|---|---|
| DEF-009 | `/api/permission` endpoint unauthenticated — leaks any user's full PII (name/email/phone/address) by ID; the dashboard's own permission logic depends on this same unauthenticated endpoint | **None found** | UNTRACKED |
| DEF-010 | Cross-tenant authorization bypass across 51 of 104 brand-router tRPC procedures, including a full privilege-escalation chain (a Brand-A admin can grant themselves admin on Brand B via `roles.ts`/`members.ts`) | **None found** | UNTRACKED |
| DEF-024 | Meta Purchase conversion value sent ~100x too high (paise/rupees confusion) | **REN-145** | Tracked, Backlog, Urgent |
| DEF-003 | Inventory double-decrement on order cancellation (relative-vs-absolute arithmetic bug), no floor against negative stock | **None found** | UNTRACKED |
| DEF-002 | Delhivery shipment stays "Active" after Renivet-side cancellation (payload field mismatch + fail-open success check); one real production AWB (`34816410001083`) is currently in this bad state, needs manual carrier-side resolution separate from the code fix | **None found** | UNTRACKED |

**Recommended immediate action, independent of this program's roadmap:** create Linear issues for DEF-009, DEF-010, DEF-003, and DEF-002 (or confirm they exist under different titles this pass's keyword search missed) and route them through the existing SPEC→REVIEW→TEST governance (`09-governance/`) at their evidenced L3-equivalent risk. Until then, `qa/`'s own release gate stays frozen and these four defects have no engineering-visible tracking at all outside the `qa/` documentation.

### Likely cross-program connection: DEF-010 and Project 08's Wave 0 F10

Project 08 (Brand Data & Commerce Integration) research independently found, via direct code trace, a **VERIFIED HIGH-severity cross-brand access-control gap**: all 6 Unicommerce brand-settings tRPC procedures in `brands.ts` check only a brand-permission bitfield and never compare `input.brandId` against the calling user's own brand — letting any authenticated brand-admin read/overwrite another brand's Unicommerce credentials (`docs/research/brand-commerce-integration/01-renivet-current-state/FINDINGS.md`, F10).

This is very likely **one instance of the same systemic defect class** `qa/`'s DEF-010 describes at scale (51 of 104 brand-router procedures, same missing-ownership-check pattern). Neither research program cross-referenced the other while finding it — they arrived independently at the same root cause from different directions (Project 08 read `brands.ts` specifically for its Unicommerce architecture question; `qa/`'s security wave audited brand-router procedures broadly). **Recommendation: treat DEF-010 as the authoritative, broader finding and F10 as corroborating evidence of one concrete instance, not as two separate defects.** A single fix (per-procedure ownership check, already shown correct elsewhere in the codebase per Wave 0 F10's cited contrast case in `brand-product-type-packing.tsx`) likely closes both.

## P0 — tracked, open

| Linear | Finding | Epic | Why it's P0 |
|---|---|---|---|
| REN-144 | Payment/order integrity: successful payment can result in partial or missing orders, no reliable reconciliation path; no `db.transaction` around per-brand/per-item order creation; Razorpay webhooks can't match consumer order IDs | EPIC-P05-001 | Structural, not edge-case — QC found it's broader than originally scoped (per-item, not per-brand) |
| REN-145 | Meta Purchase event value ~100x too high (paise/rupees) + fires once per brand instead of once per order | EPIC-P06-001 | Corrupting ad-spend/ROAS decisions on every purchase, ongoing, since shipped |
| REN-93 | Unauthenticated finance data export endpoints (TDS filing data, operational reports) | XC-SEC-001 | Marked "Deployed to Prod" in Linear — verify the fix actually closed the gap, not just that a deployment happened |
| REN-94 | Unauthenticated Delhivery/Shiprocket logistics-triggering endpoints | XC-SEC-001 | Marked "Deployed to Prod" — same verification note as REN-93 |

## P1 — tracked, real, not urgent

- **REN-136** (Node 20 EOL, hard deadline 2026-10-01, now ~4 weeks out) — most *time-sensitive* item in the reconciled portfolio, independent of severity ranking.
- **REN-115 vs. REN-143's own 5th finding** — REN-115 is marked Done (4 hardcoded Delhivery URLs fixed), but REN-143's own investigation found a **5th residual hardcoded-URL site** in `returnReplace.ts` (~line 900) not covered by REN-115's fix. Linear status says Done; actual completeness is not. Recommend a follow-up issue rather than reopening REN-115 (REN-115's original 4 sites are genuinely fixed).
- **REN-143 Phase A evidence** — PASS rows exist for the safety test matrix, but the Deployments section and Vercel Phase B evidence sub-section are still template placeholders, and the Approver field is unfilled. Treat as "implemented, evidence drafted, not formally signed off," not fully Done, despite Linear showing "Deployed to Prod."

## P2/P3 — real but lower urgency

See `01-portfolio/MASTER_REGISTER.md` and `02-epics/EPIC_MAP.md` for the full list (REN-102/103/104/105/107 type-safety/hygiene debt; REN-150/153/157/159/160/161/162/163 UX/performance findings).

## Orphaned findings with no Linear issue (lower severity than the P0s above, but real)

- `main`-branch PR-only enforcement decision — never made, flagged twice in the infra audit; `main` currently takes direct unreviewed pushes.
- Unicommerce integration's full webhook-endpoint isolation between staging and production — flagged UNVERIFIED in the infra audit, no dedicated Linear item.
- `/shop` page malformed-UUID facet input handling — real, no tracked issue.
- Web Analytics disabled on both Vercel projects — real, no tracked issue.
- REN-117/118/119 (sandbox credentials, dedicated test brand, joint staging checklist) — REN-143's own DEP-002/DEP-003 resolution notes (separate DB, separate Redis, Razorpay test keys, separate Delhivery test account) may have superseded some or all of these. Recommend confirming with whoever owns REN-143/117/118/119 rather than assuming either way.

## What this register deliberately does not do

It does not re-litigate severity ratings already assigned by `qa/`'s evidence-integrity model (CONFIRMED/PROBABLE/etc.) or by the ecommerce-intelligence audit's QC pass — those dispositions are treated as authoritative source data here, not re-adjudicated.
