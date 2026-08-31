# Cross-Project Reconciliation

## The one real cross-project finding: REN-131 (P06) vs. REN-144 (P05)

**This is new — not previously surfaced in the SRS packages or the cross-project critique, because at the time those were written, REN-131's contract did not yet exist on `master`.**

- **P05's SRS** (`P05-customer-journey/`) documents, in detail, that Renivet's order-creation mutation (`createOrder` in `orders.ts`) is not transactionally safe: it loops per line item with a try/catch that explicitly logs and continues past failures, meaning "order persisted" is not currently a reliable signal of a complete, correct order. REN-144 (P0/Urgent) exists specifically to fix this, and is explicitly unimplemented (see `P05_RECONCILIATION.md`).
- **REN-131's newly-merged, approved contract** (`docs/.work-items/REN-131/work-item.yaml`, `DEP-131-001`) explicitly names this exact same fragility ("the current route creates per-item orders within a larger mutation and has external side effects") and marks the dependency **`status: resolved`** — meaning REN-131's design proceeds treating "order persisted" as the authoritative trigger for firing a server-side `purchase_completed` event, on the understanding that the current behavior is *known*, not that it has been *fixed*.
- **The risk:** if REN-131 is implemented before REN-144 ships, Renivet would be adding a NEW consumer (server-side analytics capture) of the exact signal P05's own SRS calls unreliable — meaning a partial/silent order-creation failure (REN-144's central scenario) could now also produce an incorrect `purchase_completed` analytics event (firing on a payment that didn't fully materialize into orders, or not firing when it should), compounding a P0 correctness bug with a new analytics-correctness bug.
- **This is not a defect in either ticket's design in isolation** — REN-131's contract is honest about the dependency it's accepting, and P05's SRS is honest about REN-144's urgency. It is a **sequencing gap between two independently-approved contracts that never cross-referenced each other.**

**Recommendation:** whoever owns REN-131 and REN-144 should make an explicit sequencing decision before REN-131 implementation starts: (a) require REN-144 to ship first, or (b) accept REN-131 shipping against the current order-creation behavior with an explicit, documented caveat and a follow-up task to re-validate once REN-144 ships. Either is defensible; leaving it undecided is not.

## REN-131 / REN-133 coordination — resolved differently than expected

The prior cross-project critique (`../CROSS_PROJECT_CRITIQUE.md`, written before REN-131's contract existed) flagged a *future* risk: shipping REN-131 without coordinating REN-133's dedup fix could cause duplicate `purchase_completed`/Meta Purchase events. REN-131's own now-approved contract **already contains a dedup design** (one event per checkout via a stable checkout/order-group identifier, not one per brand-split order) — but arrived at it independently, **never citing REN-133 by ticket ID**, and no REN-133 work-item exists at all. The substantive risk (duplicate events) looks pre-empted in the contract, *if implemented as approved*; the process risk (two tickets solving the same problem without referencing each other) is real and should be reconciled — either formally retire REN-133 as folded into REN-131, or keep REN-133 open with an explicit reference to REN-131's dedup decision.

## P01/P02 shared-file coordination — unchanged, still unresolved, still not urgent

The prior cross-project critique's other finding (P01's REN-146 and P02's REN-147/REN-160 will edit the same two files, `sematic-search.ts` and `product-recommendation.ts`) remains exactly as previously documented — no code exists for either yet (see `P01_RECONCILIATION.md`, `P02_RECONCILIATION.md`), so there is no live conflict, only the same unassigned sequencing decision as before.

## Everything else checked, no conflict found

- No duplicate implementations exist anywhere (nothing has been implemented for 4 of 5 Epics).
- No conflicting APIs, state models, or event definitions were introduced — the only new code (REN-129/130) is additive and self-contained to auth tracking.
- No duplicated infrastructure was introduced.
- No inconsistent fallback or error-handling logic was introduced (no fallback/error-handling code shipped in this window).
- No entity was given two different definitions across projects.

## Summary

Of five Epics, four (P01, P02, P05, P08) have zero implementation to cross-check. The fifth (P06) surfaced one real, newly-discovered sequencing risk (REN-131 vs. REN-144) that did not exist at the time of the original cross-project critique, because REN-131's contract was approved after that critique was written. This is the single most important new finding of this reconciliation pass.
