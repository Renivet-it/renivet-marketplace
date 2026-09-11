# REN-172 Independent Critic Review

Reviewer: `ren172_critic`  
Attestation: fresh context, repository read-only, no files or external state modified, no application tests run  
Verdict: `APPROVED` (all findings below were resolved in the contract across the recorded revision/critic cycles; see `state_history` and `decisions` in `work-item.yaml`)

This document extracts and organizes the 13 substantive findings from this work item's own recorded, multi-cycle critic review (5 cycles, see `critic_findings_raw` in `work-item.yaml` for the complete category-by-category record, including the NOT_APPLICABLE verdicts omitted here).

## Findings and dispositions

### CRIT-001 — MINOR — Resolved in contract

Category: `happy_path`

No scenario asserted a legitimate same-brand caller still succeeds post-fix for the general 51-procedure case (SCN-006 only tested the admin cross-brand bypass). RESOLVED in Revision 1: SCN-010/INV-006 added.

### CRIT-002 — MAJOR — Resolved in contract

Category: `external_dependency_failures`

Verified confidential.ts's createConfidential (29-114): existingBrand fetched at line 29, Shiprocket/Delhivery/email calls all happen after — confirms the check can be inserted right after 29-34 with zero reordering cost. Minor nuance: updateConfidential/updateConfidentialDetails fire no external calls at all, so the 'external side effect' framing in REQ-004 applies fully only to createConfidential. Non-blocking, informational.

### CRIT-003 — MAJOR — Resolved in contract

Category: `concurrency`

Verified context.ts:119-138 — createContext runs fresh per request, fetches user via userCache.get(auth.userId) per-request, no shared mutable ctx across concurrent requests — confirms SCN-008's exclusion reasoning is correct. Un-addressed nuance: userCache is a Redis cache, so if brand membership changes without cache invalidation, the check could act on a stale cached brand id — a real but pre-existing risk, orthogonal to this fix. Worth a one-line addendum to SCN-008, not blocking.

### CRIT-004 — MAJOR — Resolved in contract

Category: `race_conditions`

Traced the SCN-003/SCN-009 escalation chain: each step independently enforces its own ownership check regardless of call ordering or concurrent interleaving, so no race window reopens the chain even under concurrent execution. Confirms the 'fix both links' architecture is sufficient without a distributed lock.

### CRIT-005 — MAJOR — Resolved in contract

Category: `authorization`

Two issues, both from direct source reads: (a) the single flat requireOwnBrand(ctx, input.brandId) signature doesn't generalize to >=9 of the 51 sites whose target brand is only resolvable via an existing lookup (members.ts roles.updateRoles, orders.ts getOrderShipmentDetailsByShipmentId, all 6 brand-pages.ts procedures, products.ts Journey/Value procedures) — verified each of these lacks a direct brandId on input. (b) REQ-007 mischaracterized products.ts's scope: only 1 of 6 vulnerable procedures (updateProductPublishStatus) is a true 'restore the comment' fix; 5 need genuinely new authorization logic, contradicting the original 'regression, not new development' framing. RESOLVED in Revision 1 (REQ-008/REQ-007), with Revision 1's own follow-on details resolved through Cycles 2-3 (see below). No longer blocking.

### CRIT-006 — MAJOR — Resolved in contract

Category: `tenant_isolation`

Independently re-verified PAT-TENANT-01 across all named files — the pattern is real, pervasive, accurately catalogued. One citation inaccuracy found: roles.ts's createRole/updateRole were cited as lines 29/44, but line 29 is actually getRoles's .use(), not createRole's (createRole is 44, updateRole is 108). Cosmetic, corrected in repository_investigation, not blocking.

### CRIT-007 — MINOR — Resolved in contract

Category: `security_abuse`

getOrderShipmentDetailsByShipmentId takes a bare numeric, enumerable shipmentId; the existing global rate limiter doesn't meaningfully prevent ID-enumeration probing even after the ownership fix closes the actual data leak. Pre-existing gap, out of scope for this P0 fix — recommend a follow-up ticket, not a blocking change here.

### CRIT-008 — MAJOR — Resolved in contract

Category: `pii`

Verified analytics.ts and orders.ts's zero-auth PII/revenue leaks exactly as audited. Minor gap: confidential.ts's KYC/bank/legal PII is only covered under SCN-004 (categorized external_dependency_failures), not cross-tagged as pii even though the data is squarely PII. Recommend cross-tagging at Test Design, not a new scenario — non-blocking.

### CRIT-009 — MAJOR — Resolved in contract

Category: `data_integrity`

SCN-005's grep-based structural test is sound in principle. Tied to the authorization finding above: the '51 procedures' denominator needs reconciling once REQ-007's corrected products.ts scope is accounted for, so the structural test's coverage target stays accurate. Resolved as part of the REQ-007/REQ-008 revision.

### CRIT-010 — MINOR — Resolved in contract

Category: `observability`

No requirement/scenario proposed logging/alerting on repeated cross-brand FORBIDDEN rejections for a P0 fix closing an actively-probeable full brand-takeover chain. RESOLVED in Revision 1: REQ-009/SCN-011 added.

### CRIT-011 — MAJOR — Resolved in contract

Category: `Class B resolution design (Cycle 2 re-verification of Revision 1)`

PARTIALLY RESOLVED at Cycle 2. The architectural pivot (shared comparison + per-class resolution) is confirmed correct and closes Cycle 1's blocking finding. But re-verification against origin/master found 3 concrete errors in the enumeration itself: (1) createBrandPageSection misclassified as Class B — it's actually Class A (input.brandId direct at ~line 150); the cited lines 27-34 belong to a different procedure. (2) updateProductJourney/updateProductValue's 'no new query' claim is false — their underlying tables (productsJourney/productValues) have no brand reference, only a productId FK; a genuine second lookup is required. (3) invites.ts::getInvite is a 10th, previously-unlisted Class B site, found by spot-checking exactly the files DEC-001 flagged as unverified. RESOLVED in Revision 2 (REQ-008 corrected on all 3 points; SCN-010 updated) and CONFIRMED RESOLVED at Cycle 3, which independently re-verified all 3 corrections against origin/master and found them all correct, plus found 3 more legitimate Class B sites to fold in (createProductJourney, createProductValue, updateCatalogQcReview — low-severity bookkeeping addition, added to REQ-008). No longer blocking.

### CRIT-012 — MINOR — Resolved in contract

Category: `observability parameters (Cycle 2 re-verification)`

PARTIALLY RESOLVED at Cycle 2. createOperationalAlert confirmed real with a workable signature and built-in dedup. But REQ-009 as originally added didn't specify entityType/entityId/dedupeKey/severity, risking the same per-call-site inconsistency the comparison-logic fix itself was designed to avoid. RESOLVED in Revision 2 (concrete convention added) and CONFIRMED at Cycle 3, which found one remaining minor gap (an unspecified `type` field) and fixed it directly in REQ-009 rather than needing a 4th cycle. No longer blocking.

### CRIT-013 — MINOR — Resolved in contract

Category: `spot-check for additional unenumerated sites (Cycle 3)`

Non-blocking bookkeeping gap found: 3 more products.ts procedures (createProductJourney, createProductValue, updateCatalogQcReview) are legitimately Class B via an existing getProduct() read already present for NOT_FOUND handling, but were omitted from REQ-008's list. RESOLVED directly (added to REQ-008) rather than requiring a 4th cycle — self-correcting in practice since REQ-007 already directs the implementer's attention to this exact code. Spot-checks of revenue.ts and bans.ts found no issues (both straightforward Class A / already-correctly-audited).

