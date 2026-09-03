# P05 — Customer Journey & UX

Project-definition package for Epic P05 in Renivet's Enhancement & Improvements program. This package documents the guest and authenticated purchase journey — browse → cart → checkout → payment → confirmation — with an emphasis on correctness, honesty, and consistency.

## Scope

In scope:
- Guest and authenticated checkout flows (`/checkout`, `/mycart`)
- Razorpay online payment and Cash-on-Delivery order creation
- Cart availability presentation
- Coupon auto-apply disclosure (TRYNEW20)
- Post-cancellation redirect behavior
- Guest Journey QA findings (REN-108–112)

Out of scope (tracked elsewhere, referenced not owned):
- Unauthenticated-endpoint security findings (REN-93/94-class) — Security & Compliance Audit project
- Zero test coverage on the payment/order path (REN-101) — cited as root-cause context for REN-144, owned by the security-audit project
- Post-order fulfillment defects DEF-002 (Delhivery cancellation) and DEF-003 (inventory double-decrement) — untracked portfolio risks, referenced in 08-reliability for journey-relevant context only
- P06 Measurement & Experimentation — consumes checkout/payment events this Epic produces; see `DEPENDENCY_GRAPH.md` P05→P06 edge

## How this package was built

This is a documentation-only pass. No application code, tests, config, or Linear issues were modified. All CONFIRMED claims below were verified directly against the source in this repository as of 2026-08-30 (see `01-research/EVIDENCE_INDEX.md` for exact file:line citations). Claims not independently re-derived from source are marked INFERRED, UNKNOWN, or DECISION REQUIRED per the classification discipline used throughout.

## Reading order

1. `00-context/` — business framing and current state
2. `01-research/` — what was verified in the actual codebase and how
3. `02-business-customer/` through `09-validation/` — the SRS body
4. `10-roadmap/` — V1/V2/V3 sequencing
5. `11-critique/` and `12-traceability/` — self-critique and cross-references
6. `99-final/SRS.md` — the consolidated specification and go/no-go
