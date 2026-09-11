# Renivet Enhancement & Improvements — Durable Decision Log

## D-001 — Do not formalize unsupported Epics
P03, P04, P07 remain evidence-gated. Revisit only when material evidence shows a distinct program is justified.

## D-002 — P08 File-First V1
P08 V1 uses File-First ingestion. Generalized API/scheduled/SFTP tiers remain trigger-gated.

## D-003 — P08 deterministic authority
AI never has authoritative write authority over SKU identity, inventory, price, tax, or financial/order state. Ambiguous identity cases remain human-confirmed.

## D-004 — P08 AI architecture
Deterministic-first. MiniLM may be reused narrowly for attribute candidate ranking only if its serving path is safely hardened. A hosted LLM is an optional residual path for schema/error/explanation work, not a mandatory transactional dependency. The benchmark was small/synthetic and is feasibility evidence only.

## D-005 — P05 order-integrity architecture
Fix order persistence and reconciliation with appropriate transaction boundaries plus durable state. Do not introduce a distributed saga framework without new evidence.

## D-006 — P01/P02 sequencing
Coordinate REN-146 + REN-151 first; REN-147 follows/rebases; REN-160 is additive.

## D-007 — REN-144 / REN-131 sequencing correction
Original intended order was REN-144 → REN-131 → REN-133. REN-131 shipped early; the predicted analytics-overstatement consequence materialized. REN-144 must therefore include correction/revalidation of the live REN-131 behavior.

## D-008 — F10 folded into DEF-010
Do not create a separate F10 issue. F10 is a verified subset of DEF-010.

## D-009 — No artificial Linear hierarchy
Do not create Projects/Epics solely to mirror documentation. Use actual Linear capabilities and traceability.

## D-010 — REN-144 design blockers resolved without human input
Date: 2026-09-01. Decision: Critic Cycle 3's three DESIGN_BLOCKER findings (idempotency schema, webhook lookup cardinality, stock-update error-swallowing) were all resolved as concrete engineering decisions within the SPEC, not escalated as human/Product decisions. Reason: each had exactly one code-verifiable correct answer discoverable by direct schema/source re-verification (e.g. `orders.paymentId` already exists and is already correctly populated; `orderItems.variantId` is nullable, requiring partial unique indexes rather than one combined constraint). Evidence: `docs/.work-items/REN-144/work-item.yaml` Revision 3/4, Critic Cycles 3-4. Impacted items: REN-144 only. Revisit trigger: none — closed unless implementation reveals the schema assumptions were wrong.

## D-011 — DEC-001 remains the sole open item for REN-144
Date: 2026-09-01. Decision: Whether a manual/admin-side reconciliation process for orphaned orders already exists outside the codebase is not resolvable by code investigation and was not invented or assumed away. Reason: this is an operational-process fact known only to Product/Support, not derivable from source. Evidence: REN-144 Linear comment thread, `docs/.work-items/REN-144/work-item.yaml` DEC-001. Impacted items: REN-144 (blocks `APPROVED` state). Revisit trigger: Product/Support answers the question.

## New decision format
Add: date, decision, reason, evidence, impacted items, revisit trigger.
