# Decision Queue

Decisions this reconciliation surfaced as needing a named human owner. Distinct from `docs/decisions/` (the repo's actual ADR promotion target, currently empty) — this is a staging list of *what needs deciding*, not a record of decisions made. Nothing here has been decided by this program; per §33, this pass makes no product/business decisions.

| ID | Decision needed | Source | Blocks |
|---|---|---|---|
| DECISION-XC-001 | Should `main` get PR-only branch protection like `master`? | Infra audit, flagged twice (audit item 7, `STAGING_TARGET_ARCHITECTURE.md` Model C) | Nothing directly, but `main` currently takes direct unreviewed pushes |
| DECISION-P05-001 through 006 | 6 unresolved product/security/finance decisions blocking REN-95 (checkout login wall) — enumerated in the SPEC governance tooling's pilot run against REN-95, not restated here | `CODEX_SPEC_IMPLEMENTATION_REPORT.md`, `docs/.work-items/` REN-95 pilot | REN-95 implementation (`10-roadmap/EXECUTION_SEQUENCE.md` NEXT) |
| DECISION-XC-002 | Are REN-117/118/119 (sandbox credentials, dedicated test brand, joint staging checklist) still needed, or superseded by REN-143's own DEP-002/DEP-003 resolution (separate DB/Redis/Razorpay-test-keys/Delhivery-test-account already confirmed)? | Infra-audit inventory, this pass | Nothing blocking, but risks duplicate/stale backlog items |
| DECISION-P06-001 | Is GA4 needed as a second revenue-reporting source at all, or is PostHog+Meta sufficient? | REN-166, corroborated by `docs/growth-audits/2026-08-23/` (GA4 e-commerce columns currently all zero) | REN-166 (currently correctly deferred pending this) |
| DECISION-XC-003 | Who owns and staffs a human-review escalation path for AI-assisted mapping/matching, if P08 Phase 1 is greenlit? | P08's own business critique (`docs/research/brand-commerce-integration/14-critic/BUSINESS_CRITIQUE.md`), generalized in `../AI_GOVERNANCE.md` principle 7 | P08 Phase 1 readiness, and any future Epic proposing an AI-assist review queue |
| DECISION-XC-004 | Should DEF-010's systemic cross-tenant fix be scoped as one portfolio-wide fix (all 51 procedures) or addressed per-integration (Unicommerce first, per Wave-0 F10, then the rest)? | `08-risks/PORTFOLIO_RISK_REGISTER.md` | Whoever picks up DEF-010 once it has a Linear issue |

## Note

This list is not exhaustive of every decision implied by every finding in `AUDIT_TO_BACKLOG_TRACEABILITY.md` — it captures the decisions this pass found explicitly named as blocking or unresolved, not every judgment call an eventual implementer will make.
