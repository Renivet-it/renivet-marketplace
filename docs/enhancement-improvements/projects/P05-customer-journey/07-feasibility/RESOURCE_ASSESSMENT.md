# Resource Assessment — P05 Customer Journey & UX

Effort is relative (S/M/L/XL), not calendar-estimated — this documentation pass does not have authority to commit engineering schedule.

| Item | Effort | Primary skill needed |
|---|---|---|
| REN-144 transaction boundary | M | Backend (Drizzle/Postgres transactions) |
| REN-144 reconciliation record + detection job | M–L | Backend + a decision on webhook ownership (FR-1.5) |
| REN-95 (all three layers, post-decision) | **XL** — largest single item in the reconciled portfolio | Backend (schema migration + tRPC), frontend (route logic), product/security/finance sign-off first |
| REN-152 consolidation | M–L | Frontend refactor, regression-test authoring |
| REN-153 cart availability | S | Frontend |
| REN-161 disclosure | S (post short investigation) | Backend investigation (S) + frontend/copy (S) |
| REN-163 redirect | S | Frontend |
| REN-108/110/112 (Guest Journey misc) | S each | Frontend |
| REN-109 (tab title) | S (trivial — one metadata field) | Frontend |

## Sequencing implication
REN-144 and the Guest Journey/small fixes (REN-153/161/163/108/109/110/112) have no cross-dependency and can proceed in parallel with different engineers. REN-95 should not be scheduled until `07-decisions/DECISION_QUEUE.md`'s 6 items resolve — scheduling engineering time against it before then risks idle/blocked capacity. REN-152 benefits from happening after REN-144's fix (so the consolidated module is built correctly from the start) but does not strictly require it.
