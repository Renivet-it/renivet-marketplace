# Audit to Epic Traceability — P05 Customer Journey & UX

Cross-references `docs/enhancement-improvements/AUDIT_TO_BACKLOG_TRACEABILITY.md` (top-level, not re-derived here) for this Epic's items.

| Source | Finding | Linear ID | This Epic's treatment |
|---|---|---|---|
| Guest Journey QA (Linear Project) | Guest wishlist missing header/footer | REN-108 | `03-requirements/FUNCTIONAL_REQUIREMENTS.md` FR-7.1 |
| Guest Journey QA | Cart tab title reads "Profile" | REN-109 | FR-7.2, independently CONFIRMED this pass |
| Guest Journey QA | Search modal missing aria-describedby | REN-110 | FR-7.3 |
| Guest Journey QA | Inconsistent guest-redirect behavior | REN-111 | FR-7.4, mechanism CONFIRMED this pass (`/checkout` vs `/mycart`) |
| Guest Journey QA | Homepage interstitial third-button copy | REN-112 | FR-7.5 |
| `qa/` production-safety program | Payment/order integrity | REN-144 | Central case, `04-architecture/STATE_MACHINE.md`, `08-reliability/FAILURE_MATRIX.md` |
| `qa/` / backlog | Checkout login wall | REN-95 | FR-2, blocked on `07-decisions/DECISION_QUEUE.md` |
| `qa/` / backlog | Duplicated checkout implementations | REN-152 | FR-4, confirmed broader (3rd duplicate surface) |
| `qa/` / backlog | Cart availability not shown | REN-153 | FR-3 |
| `qa/` / backlog | TRYNEW20 disclosure | REN-161 | FR-5 |
| `qa/` / backlog | Cancellation redirect | REN-163 | FR-6 |
| Security & Compliance Audit (cross-cutting, not owned here) | Zero test coverage on payment/order path | REN-101 | Cited context, `08-reliability/SECURITY.md`, `09-validation/TEST_STRATEGY.md` |
| Portfolio Risk Register (untracked) | Delhivery shipment stuck after cancellation | DEF-002 | Referenced context, `08-reliability/FAILURE_MATRIX.md` |
| Portfolio Risk Register (untracked) | Inventory double-decrement on cancellation | DEF-003 | Referenced context, `08-reliability/FAILURE_MATRIX.md` |
