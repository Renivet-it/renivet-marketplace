# Gate 25 — Final Execution Sequence

Recalculated from actual dependencies and readiness established in Gates A–L, not assumed from the source prompt's proposed order. Two tracks, explicitly separated per program rule: urgent safety work proceeds in parallel with strategic Epic work, never delayed by it.

## URGENT SAFETY WORK (proceed immediately, independent of Epic sequencing)

1. **Create Linear issues for DEF-009, DEF-010, DEF-002, DEF-003** and route through SPEC governance at L3-equivalent risk. Fixing DEF-010 closes F10 as a byproduct (F10 is a verified subset — Gate A).
2. **REN-144** (P0, payment/order integrity) — fully specified, zero remaining unknowns beyond implementation effort. Ship this before any P06 work touching purchase capture.
3. **Close REN-143's evidence gap** — fill in `PHASE-A-EVIDENCE.md`/`PHASE-B-EVIDENCE.md`'s placeholders and get a named Approver. This is a documentation/verification task, not new engineering — cheap, and needed to make the "Deployed to Prod" label trustworthy.

**Removed from the urgent list, now confirmed complete:** REN-136 (Node 24 — verified via `package.json`/`.nvmrc`), REN-115 (5th site — verified fixed), REN-93/94 (verified at code level).

## STRATEGIC EPIC WORK

**P01 + P02, run together (shared-file coordination required, Gate D):**
1. REN-146 + REN-151 as one coordinated change (both hit `product.ts:1177-1230`) — timeouts, real env-var config, parallelized calls, across the 5 corrected live files.
2. REN-147 rebases on REN-146 (its FR-1.4 requirement is satisfied by REN-146's fix); build its new independent fallback chain in `cart.ts` (porting PDP's existing pattern).
3. REN-160 in parallel with or after REN-147 (additive caching, low conflict).
4. Remainder of P01 (REN-148, 149, 154, 155, 156, 158, 159) and P02 (REN-150, 157) — independent, any order, no blockers.
5. REN-167 (P01) and REN-168 (P02) stay correctly DEFERRED, gated on data/business-need triggers, not scheduled.

**P05:**
1. REN-144 — see urgent track above (same item, listed once).
2. REN-152, REN-153, REN-161, REN-163, REN-108–112 (Guest Journey findings) — all independent, no blockers, proceed any order.
3. **REN-95 — NOT READY.** Requires its SPEC pilot to be re-run with artifacts actually committed this time (Gate C) before implementation can start. This is a process/governance action, not an engineering blocker in the usual sense.

**P06:**
1. REN-144 (P05) must land first — see sequencing in Gate B/`02-REN131_133_SEQUENCE.md`.
2. REN-131 — implement only after REN-144 ships; re-validate its checkout/order-group identifier design against REN-144's actual implementation.
3. REN-133 — implement last, with its `/SPEC` explicitly referencing REN-131's dedup identifier.
4. REN-145 (P0, currency+fanout), REN-132, REN-134 — all independent of the above sequencing, proceed now.
5. REN-166 stays correctly DEFERRED pending DECISION-P06-001 (GA4 product decision).

**P08 — blocked on two independent gates, F10 exception carved out:**
1. F10's fix ships via the DEF-010 urgent-track fix above — does not wait on anything below.
2. **Leadership authorization decision** (Gate F) — a business decision, required before any Linear tracking or engineering start.
3. **Real brand-data corpus sourcing** (Gate G) — required before POC validation is meaningful, can run in parallel with #2.
4. Once both land: convert `RECOMMENDED_ARCHITECTURE.md`/`POC_PLAN.md` into real Linear issues and proceed through the same SPEC→REVIEW→TEST governance as every other Epic.

## Combined priority order (severity + dependency, not a flat priority sort)

1. DEF-009/010/002/003 tracking + fixes (independent, urgent, unblocks nothing else but is the single highest-severity gap)
2. REN-144 (unblocks P06's REN-131/133 sequencing, is itself P0)
3. REN-143 evidence closure (cheap, unblocks trustworthy staging validation for everything else)
4. REN-146+REN-151 (P01/P02 shared coordination, unblocks REN-147/167)
5. Remainder of P01/P02, P05 (excl. REN-95), P06 (excl. REN-131/133) — parallel, no cross-blocking
6. REN-95's SPEC re-run (governance action, unblocks that one item)
7. REN-131 → REN-133 (P06, sequenced behind #2)
8. P08 authorization decision + data sourcing (business/data-ops actions, run in parallel, unblock P08 entirely)
