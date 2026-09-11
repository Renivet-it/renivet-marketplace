# Renivet Enhancement & Improvements — Live Program State

> Dynamic checkpoint. Reconcile against remote Git + live Linear before consequential work.

## Last verified baseline
- Latest remote/default branch re-verified this iteration (2026-09-01): `origin/master`
- Latest verified SHA: `0423b6be32340155d480aa5fc49d3f88eeff1523` (unchanged since prior pass — no new commits touched REN-144-relevant files)
- Local working-tree changes are not production evidence.

## Current state

### Urgent safety/correctness
| Item | State | Next |
|---|---|---|
| REN-144 | SPEC in CRITIQUE, Revision 4; all developer-level design blockers resolved; **1 open item remains: DEC-001 (human/Product decision)** | Get Product/Support to answer DEC-001; optionally run one more Critic cycle to verify Revision 4's two mid-review corrections (webhook refund-branch scoping, idempotency partial indexes) before implementation |
| REN-171 / DEF-009 | Linear created; SPEC not started | /SPEC |
| REN-172 / DEF-010 | SPEC completed/critique path | Continue REVIEW/TEST after approval |
| REN-173 / DEF-002 | Linear created; SPEC not started | /SPEC |
| REN-174 / DEF-003 | Linear created; SPEC not started | /SPEC |
| REN-143 | Implemented but evidence not verified | Complete Phase A/B evidence + named approver |

### Measurement
| Item | State | Next |
|---|---|---|
| REN-131 | Already shipped to production | Revalidate/fix as part of REN-144 outcome |
| REN-133 | Backlog, Medium | Wait for REN-144/REN-131 reconciliation; then /SPEC |

### Discovery
| Epic | State | Next |
|---|---|---|
| P01 | Ready | REN-146 + REN-151 coordinated first |
| P02 | Ready | REN-147 after REN-146; REN-160 as safe additive work |
| P05 | Ready with REN-95 condition | Fresh SPEC decision run |
| P06 | Ready with REN-131/133 sequencing condition | Revalidate after REN-144 |
| P08 | Not authorized | Leadership decision + real-data sourcing |

## Durable current facts
- DEF-009 → REN-171
- DEF-010 (+ F10 subset) → REN-172
- DEF-002 → REN-173
- DEF-003 → REN-174
- No P08 Linear issues unless authorization is confirmed.
- Do not duplicate any issue.

## High-risk facts
- REN-144 remains a live P0 order-integrity issue; SPEC is technically complete pending one human decision (DEC-001).
- REN-131 shipped before REN-144 and can overstate `purchase_completed` on partial success — REN-144's SPEC (REQ-008/INV-006/SCN-012) explicitly re-confirmed this pass as still valid and unaffected by REN-144's other changes.
- REN-143 has a Linear/evidence contradiction.
- DEF-010 is the broad cross-tenant authorization issue; F10 is a subset.

## REN-144 SPEC — resolved this iteration (2026-09-01)
All 3 developer-level DESIGN_BLOCKERs Critic Cycle 3 left open are now resolved as concrete engineering decisions (no human input needed):
1. Idempotency: `orders.paymentId` already exists/populated; new `orderItems.paymentId` column + two partial unique indexes (a single combined constraint would have silently failed to protect non-variant products, since `variantId` is nullable there).
2. Webhook cardinality: one payment maps to many order rows (one per line item) — switch `getOrderById` to a plural `findMany` lookup, loop reconciliation; also found and closed a follow-on gap where the existing stock-insufficiency refund branch would otherwise fire once per sibling row.
3. Stock-update error-swallowing: confirmed fully resolved, including a sharper zero-rows-affected case that isn't even a thrown exception in this codebase's query pattern.

**Not yet independently critic-verified:** Revision 4's two mid-review corrections (webhook refund-branch scoping; partial unique indexes). Flagged as the natural first action of the next iteration touching REN-144, not silently treated as done.

## Update rule
After each controlled iteration, update:
- verified remote SHA
- relevant Linear status
- completed action
- new blockers
- next action
