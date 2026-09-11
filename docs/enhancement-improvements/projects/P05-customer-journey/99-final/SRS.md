# Software Requirements Specification — P05 Customer Journey & UX

## 1. Purpose
Specify the requirements to make Renivet's guest and authenticated purchase journey (browse → cart → checkout → payment → confirmation) correct, honest, and consistent, per `00-context/BUSINESS_CONTEXT.md`.

## 2. Scope
See `00-context/README.md` for in-scope/out-of-scope boundaries. This SRS consolidates `03-requirements/`, `04-architecture/`, and `08-reliability/` into one reference; it does not restate `01-research/`'s full evidence (see `01-research/EVIDENCE_INDEX.md`).

## 3. System overview
Two independent checkout implementations (`/checkout`, `/mycart` step 2) plus a third partial duplicate (profile checkout modal) drive Razorpay online payment and Delhivery-fulfilled COD orders across a multi-brand marketplace cart. See `04-architecture/SYSTEM_ARCHITECTURE.md`.

## 4. Functional requirements
See `03-requirements/FUNCTIONAL_REQUIREMENTS.md` (FR-1 through FR-7) in full. Summary:
- FR-1: Atomic, reconcilable order creation (REN-144).
- FR-2: Guest checkout capability (REN-95, decision-gated).
- FR-3: Cart availability visibility (REN-153).
- FR-4: Single shared checkout business-logic implementation (REN-152).
- FR-5: Honest TRYNEW20 disclosure (REN-161).
- FR-6: Context-aware cancellation redirect (REN-163).
- FR-7: Guest Journey QA fixes (REN-108–112).

## 5. Non-functional requirements
See `03-requirements/NON_FUNCTIONAL_REQUIREMENTS.md` (NFR-1 through NFR-7): data integrity, auditability, backward compatibility, performance, accessibility, minimum test coverage for this Epic's changes, and cross-surface consistency during consolidation.

## 6. State machine
See `04-architecture/STATE_MACHINE.md` — the current (broken) and target checkout/payment state machines, and the current guest-vs-authenticated entry-point inconsistency.

## 7. Failure modes
See `08-reliability/FAILURE_MATRIX.md` — six scenarios, with REN-144's payment-captured/order-creation-failure as the central, most severe case.

## 8. Acceptance criteria
See `03-requirements/ACCEPTANCE_CRITERIA.md`, organized per Linear issue.

## 9. Traceability
See `12-traceability/` for full audit-to-epic, story-to-issue, and issue-to-task mappings.

## 10. Open items
All DECISION REQUIRED items are consolidated in `99-final/OPEN_DECISIONS.md`.

## 11. Cross-Epic references
- `docs/enhancement-improvements/02-epics/EPIC_MAP.md` — EPIC-P05-001 entry.
- `docs/enhancement-improvements/DEPENDENCY_GRAPH.md` — the evidenced P05 → P06 edge (checkout/payment events feed measurement).
- `docs/enhancement-improvements/AUDIT_TO_BACKLOG_TRACEABILITY.md` — portfolio-wide audit trail.
- `docs/enhancement-improvements/08-risks/PORTFOLIO_RISK_REGISTER.md` — DEF-002/DEF-003 untracked risk context.
