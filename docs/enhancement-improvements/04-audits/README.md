# Audits — Index

Historical audit artifacts are preserved in place, not moved. This is a pointer index only — see `../AUDIT_TO_BACKLOG_TRACEABILITY.md` for finding-level detail.

| Audit program | Location | Scope | Status |
|---|---|---|---|
| E-commerce Intelligence (search/recommendations/checkout/tracking) | `docs/audits/ecommerce-intelligence/` (`2026-08-26/`, `2026-08-27-backlog/`, `2026-08-27-qc/`, `2026-08-27-tracking/`) | Search, recommendations, customer journey, analytics/ads | Complete; 20 new Linear issues created, 3 deferred, 2 verification-only |
| Root security/tech-debt audit | `AUDIT.md` | Unauthenticated endpoints, hardcoded credentials, type-safety erosion, App Router structure | Complete; issues REN-92–107 |
| Infrastructure / Vercel / Staging | `docs/infrastructure-audits/2026-08-25/` (23 files) | Staging isolation, build cost, DB/Redis reliability, Node EOL | Complete; target architecture (Model B) implemented via REN-143, evidence not yet formally signed off |
| Growth / marketing data | `docs/growth-audits/2026-08-23/` | 5-month Meta Ads/PostHog/GA4 pull, attribution | Complete; corroborates REN-166's GA4 gap independently |
| Production-safety QA program | `qa/` | Payment/order integrity, security (IDOR, access control), catalog, marketplace ops | **Self-frozen** — 5 P0 gate items (`DEF-009/010/024/003/002`) block further waves, 4 of 5 have no Linear issue — see `../08-risks/PORTFOLIO_RISK_REGISTER.md` |
