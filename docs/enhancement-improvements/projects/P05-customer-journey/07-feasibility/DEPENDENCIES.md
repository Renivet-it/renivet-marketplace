# Dependencies — P05 Customer Journey & UX

## Internal to this Epic
- REN-95 implementation depends on `07-decisions/DECISION_QUEUE.md`'s 6 unresolved items (product/security/finance).
- REN-152 consolidation should sequence after REN-144's transaction-boundary fix so the unified checkout module inherits the corrected order-creation logic rather than propagating the current bug into a newly-shared file.
- REN-161's fix depends on FR-5.1 (determine actual server-side eligibility rule) as a hard prerequisite.
- REN-153 and REN-163 have no dependencies on other items in this Epic.

## Cross-Epic
- **P05 → P06 (Measurement & Experimentation)**: checkout/payment events (order creation, `POSTHOG_EVENTS.COMMERCE.PURCHASE_COMPLETED`, Meta Purchase CAPI events) are emitted from the exact code paths REN-144 touches. If REN-144's fix changes when/how orders are considered "created," P06's event timing and completeness should be re-validated against the new flow — this is a real, evidenced edge per `docs/enhancement-improvements/DEPENDENCY_GRAPH.md`, not a hypothetical one.
- **Security & Compliance Audit (REN-101)**: zero test coverage on the payment/order path is cited, not owned, here. NFR-6 sets a minimum bar (tests for this Epic's own changes) without claiming to close REN-101.
- **XC-INFRA-001 (staging)**: safely testing REN-144's transaction/reconciliation fix against a real Razorpay test flow depends on trustworthy staging (flagged portfolio-wide as a soft blocker in `DEPENDENCY_GRAPH.md`).

## External
- Razorpay's own webhook delivery guarantees and payload contract (for FR-1.5) — not controlled by Renivet, must be designed against Razorpay's documented retry/idempotency behavior (not verified in this pass; a research task, not assumed).
- Clerk's session model, if REN-95's guest-identity mechanism involves an anonymous Clerk session rather than a fully sessionless guest flow.
