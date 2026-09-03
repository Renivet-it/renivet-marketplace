# REN-144 Independent Critic Review

Reviewer: `ren144_critic`  
Attestation: fresh context, repository read-only, no files or external state modified, no application tests run  
Verdict: `APPROVED` (all findings below were resolved in the contract across the recorded revision/critic cycles; see `state_history` and `decisions` in `work-item.yaml`)

This document extracts and organizes the 28 substantive findings from this work item's own recorded, multi-cycle critic review (5 cycles, see `critic_findings_raw` in `work-item.yaml` for the complete category-by-category record, including the NOT_APPLICABLE verdicts omitted here).

## Findings and dispositions

### CRIT-001 — MINOR — Resolved in contract

Category: `invalid_inputs`

Neither SPEC.md nor the scenarios cover a malformed/adversarial webhook payload (e.g. a well-formed order_id referencing an already-cancelled/refunded order) hitting the new razorpayOrderId lookup path. Non-blocking edge case; add at Step 8 (Test Architect).

### CRIT-002 — MAJOR — Resolved in contract

Category: `duplicate_operations`

SCN-007/SCN-008 originally asserted an idempotency-key mechanism the Architecture section never actually designed. Verified on origin/master: razorpayPaymentId/intentId are only logged (lines 274-275,307,403,622-637,1327), no existing-order lookup before insert, no unique constraint. A per-brand transaction alone does not provide idempotency. RESOLVED in Revision 1: REQ-009/INV-007 add an explicit unique-constraint-backed idempotency design; SCN-007 updated accordingly.

### CRIT-003 — MAJOR — Resolved in contract

Category: `invalid_state_transitions`

Traced the current per-item loop (orders.ts 536-1440): order row + orderItems insert, then a real Delhivery shipment/AWB (1016-1039), THEN stock validation/decrement (1258-1307), then email — all before pushing to createdOrders. A later item's failure in the same brand-call cannot un-send an earlier item's already-real shipment. Original Architecture's db.transaction() didn't specify whether it spans external calls or just DB writes. RESOLVED in Revision 1: REQ-011/INV-009 introduce a two-phase design (DB phase fully commits before any external side effect is attempted for that brand-call), eliminating this class of orphaned real-world side effect entirely rather than compensating after the fact.

### CRIT-004 — MAJOR — Resolved in contract

Category: `external_dependency_failures`

Read both webhook handlers in full (payments/route.ts 445-823, refunds/route.ts 824-1207). The payments webhook's payment.captured case is a dormant, independently-written second fulfillment pipeline (re-decrements stock via updateProductStock at 621-639, re-sends confirmation email at 641-681, attempts Shiprocket AWB/label/manifest generation against fields the current create-time flow never populates) that never runs today only because the ID lookup fails — REQ-007's original scope (fix the lookup only) would reactivate it, double-decrementing stock and calling a courier API with an undefined shipment_id. RESOLVED in Revision 1: REQ-007 revised to require the webhook become reconciliation-only for orders already created at checkout time — no re-run of fulfillment side effects. INV-010/SCN-018 added.

### CRIT-005 — MAJOR — Resolved in contract

Category: `concurrency`

Two issues: (1) the stock-availability check reads productDetailsByIndex fetched once via Promise.all before the per-item loop begins (orders.ts 491-511) — a TOCTOU race across concurrent checkouts on the same product. (2) updateProductStock (product.ts 3497-3537) has no WHERE quantity >= N floor guard. The original per-brand-transaction proposal did not address either. RESOLVED in Revision 1: REQ-010/INV-008 require an atomic, conditional decrement evaluated at write time inside the transaction, replacing the pre-loop snapshot read as the authorization decision.

### CRIT-006 — MAJOR — Resolved in contract

Category: `race_conditions`

Same root cause as concurrency, viewed as a race — concurrent checkouts on the last unit of stock is an unmitigated overselling race. Also, SCN-009's alert-attribution-race scenario was asserted without a design for how concurrent createOperationalAlert calls avoid cross-attribution. RESOLVED (oversell) in Revision 1 via REQ-010/INV-008/SCN-008. Alert-attribution race (SCN-009) remains a Test-Design-stage concern, not blocking on its own — createOperationalAlert calls already carry the specific order/brand identifiers as parameters per its existing usage elsewhere in this file, so cross-attribution is unlikely by construction, but this should be explicitly asserted by SCN-009's eventual test.

### CRIT-007 — MINOR — Resolved in contract

Category: `idempotency`

Same underlying gap as duplicate_operations, flagged separately since it is its own checklist category. RESOLVED in Revision 1 via REQ-009/INV-007.

### CRIT-008 — MAJOR — Resolved in contract

Category: `tenant_isolation`

Order-creation/read paths are correctly user-scoped, no cross-user leak. However, the Architecture's proposed extension of the order-ops dashboard query (general/order-ops.ts) sits behind a single site-wide permission bit, not brand-scoped — very likely intentional (internal staff surface), but the SPEC should state this assumption explicitly rather than leave it implied, since the dashboard is named as in-scope infrastructure being extended. Addressed in Revision 1 by adding an explicit assumption note in the Architecture section; not a design change.

### CRIT-009 — MAJOR — Resolved in contract

Category: `data_integrity`

Umbrella of the concurrency/rollback/external-dependency findings above: (1) a real Delhivery AWB can be issued for a brand-call that ultimately fails; (2) stock can go negative under concurrent checkouts; (3) the payments webhook would double-decrement stock once its lookup is fixed, unless gated. All three demonstrated directly from origin/master, independent of the SPEC's original framing. RESOLVED in Revision 1 via REQ-009/010/011 and the corresponding invariants/scenarios.

### CRIT-010 — MAJOR — Resolved in contract

Category: `rollback_recovery`

A db.transaction() can only roll back DB writes — it cannot un-create an already-issued Delhivery AWB or un-send an email. The original Architecture had no compensating-action design. RESOLVED in Revision 1: the two-phase design (REQ-011/INV-009/SCN-017) means external side effects are only ever attempted after the DB phase is durably committed, so a DB-phase failure never has an external side effect to compensate for in the first place — a stronger guarantee than adding a cancelDelhiveryOrder compensating call after the fact.

### CRIT-011 — MINOR — Resolved in contract

Category: `analytics`

REQ-008/INV-006/SCN-012 correctly diagnose that capturePurchaseCompleted's totalAmountPaise/productIds/brandIds/totalItems are computed from input.* rather than createdOrders (verified via git diff against origin/master). One nuance not previously noted: orderIds: createdOrders.map(...) is ALREADY correctly scoped in the current shipped code — only the amount/item/brand fields are wrong. Non-blocking; informational for whoever implements the re-patch so it doesn't unnecessarily touch the already-correct field.

### CRIT-012 — MAJOR — Resolved in contract

Category: `duplicate_operations (Cycle 2 re-verification of Revision 1)`

STILL BLOCKING. Verified orders.ts:536-643 creates ONE ORDER ROW PER LINE ITEM (fresh generateOrderId() call every loop iteration), and orders schema has no brandId-level aggregation — a legitimate 3-item single-brand cart produces 3 rows sharing (razorpayPaymentId, brandId). Revision 1's literal (razorpayPaymentId, brandId) unique-constraint design would reject items 2 and 3 on the happy path, not just genuine retries. RESOLVED in Revision 2: REQ-009/INV-007 corrected to key at the actual per-line-item granularity.

### CRIT-013 — MAJOR — Resolved in contract

Category: `idempotency (Cycle 2 re-verification)`

Same root cause and same resolution as duplicate_operations above.

### CRIT-014 — MAJOR — Resolved in contract

Category: `external_dependency_failures (Cycle 2 re-verification)`

PARTIALLY RESOLVED. The real risk (unconditional stock re-decrement + re-email in the live payments-webhook handler, payments/route.ts:444-821) is confirmed and the reconciliation-only fix direction is correct. Two corrections made in Revision 2: (1) the original justification's claim of a live Shiprocket/AWB risk was factually wrong — that code is dead/commented-out (lines 1-443) in this file; evidence corrected, requirement unchanged. (2) the proposed gate criterion ('shipment row exists') was itself broken by REQ-011's own Phase-2-pending state (see NEW FINDING B below) — corrected to key off Phase-1/order-row existence instead. refunds/route.ts independently confirmed to have no analogous risk, no gate needed there.

### CRIT-015 — MAJOR — Resolved in contract

Category: `concurrency (Cycle 2 re-verification)`

PARTIALLY RESOLVED. The atomic-conditional-decrement direction is correct and confirmed to close the core oversell race. Two gaps found: (1) updateProductStock (product.ts:3497-3537) opens its own internal db.transaction() — Revision 1 didn't specify how this nests inside Phase 1's outer per-brand-call transaction; (2) isStockAvailable bundles non-quantity flags (verificationStatus, isDeleted, isAvailable) into the same pre-loop-snapshot boolean the SPEC's 'atomic decrement' language didn't explicitly cover. RESOLVED in Revision 2: REQ-010 expanded to require both the outer-transaction join and the non-quantity flags be re-checked atomically at write time.

### CRIT-016 — MAJOR — Resolved in contract

Category: `race_conditions (Cycle 2 re-verification)`

Same evidence and resolution as concurrency above (oversell race). Alert-attribution race (SCN-009) remains a Test-Design-stage concern per Cycle 1, not re-examined in Cycle 2.

### CRIT-017 — MAJOR — Resolved in contract

Category: `data_integrity (Cycle 2 re-verification, umbrella)`

PARTIALLY RESOLVED as an umbrella — resolved on the invalid-state-transition/rollback components, still blocking on the idempotency-granularity and concurrency-nesting specifics until Revision 2's fixes (REQ-009/010) are themselves re-verified. Those specifics were confirmed re-verified/resolved at Cycle 3 and this controller iteration.

### CRIT-018 — MAJOR — Resolved in contract

Category: `NEW (Cycle 2): reconciliation gate keyed on the wrong signal`

Architecture item 5's original gate ('does this order already have a shipment row?') is defeated by REQ-011's own Phase-2-pending-failure design: a fully legitimate, Phase-1-committed order can have NO shipment row yet (Phase 2 still retrying). The original gate would misclassify that order as unfulfilled and let the dangerous re-decrement/re-email pipeline run against it — undoing the exact atomicity guarantee REQ-011 was built to provide. RESOLVED in Revision 2: gate criterion changed to key off order-row/Phase-1-commit existence, not shipment-row existence; SCN-020/INV-010 added to test the Phase-2-pending case specifically, which the original SCN-018 alone would not have caught.

### CRIT-019 — MAJOR — Resolved in contract

Category: `NEW (Cycle 2): pre-existing server-side full-cart-drop bug, unaddressed by Revision 1`

orders.ts:1447-1450 (`userCartCache.drop(user.id)`) unconditionally drops the customer's ENTIRE cart cache once per createOrder/brand-call invocation — fires after brand A's items complete but before the client's sequential per-brand loop has necessarily called createOrder for brand B. Revision 1's Architecture item 3 ('cart-clearing becomes scoped') only addressed the CLIENT-side deleteItemFromCart call and missed this independent server-side full-cache-drop entirely, meaning REQ-002 would still be violated even after Revision 1. RESOLVED in Revision 2: REQ-012/INV-011/SCN-019 added to scope this call site too.

### CRIT-020 — MAJOR — Resolved in contract

Category: `idempotency key granularity (Cycle 3 re-verification of Revision 2)`

PARTIALLY RESOLVED at Cycle 3. Confirmed orders.ts:591-616 inserts one order row per line item, matching Cycle 2. But src/lib/db/schema/order.ts's orders table has NO productId/variantId columns today — those exist only on orderItems (which lacks a paymentId column) and the transient input object. RESOLVED in this controller iteration (2026-09-01): direct schema re-verification found orders.paymentId ALREADY EXISTS and is already populated with the Razorpay payment id (orders.ts:1315-1332) — the gap is narrower than feared. Concrete fix specified: add paymentId to orderItems (denormalized, same source), unique constraint on (paymentId, productId, variantId). No longer blocking — resolved as an engineering decision, not deferred to a human.

### CRIT-021 — MAJOR — Resolved in contract

Category: `webhook gate criterion cardinality (Cycle 3 re-verification)`

NEW STRUCTURAL GAP at Cycle 3. payment.ts:141 confirms one Razorpay order_id is created per whole multi-brand checkout, not per brand — and since orders.ts creates one order row per LINE ITEM, a single razorpayOrderId/razorpayPaymentId is shared by MANY order rows. orderQueries.getOrderById (order.ts:999-1029) uses db.query.orders.findFirst — a singular lookup. RESOLVED in this controller iteration (2026-09-01): REQ-007 now specifies a concrete fix — findMany keyed on orders.paymentId, loop reconciliation over every returned sibling row. SCN-021/INV-005 added to test the multi-row case explicitly. No longer blocking — resolved as an engineering decision.

### CRIT-022 — MAJOR — Resolved in contract

Category: `concurrency / stock-update error-swallowing (Cycle 3 re-verification)`

NEW STRUCTURAL GAP at Cycle 3. Confirmed db.transaction with an outer tx handle is standard, already-used Drizzle idiom in this codebase (corporate-order.ts:85,913) — no framework blocker to REQ-010's transaction-joining requirement. BUT updateProductStock (product.ts:3541-3548) wraps each per-item update in its own try/catch that silently converts a failure into a swallowed {success:false} return instead of throwing, AND the call site (orders.ts ~1299-1313) has its corresponding TRPCError throw already commented out. RESOLVED in this controller iteration (2026-09-01), with an important sharpening found by direct re-verification of product.ts:3497-3548: a WHERE-guarded UPDATE returning zero rows is NOT a thrown exception in this codebase's `const [result] = await tx.update(...).returning()` pattern — it silently produces `{success:true, data:undefined}`, bypassing even the try/catch entirely. REQ-010 now requires an explicit falsy-result check in addition to fixing the try/catch. SCN-022 added. No longer blocking — resolved as an engineering decision.

### CRIT-023 — MAJOR — Resolved in contract

Category: `REQ-009 idempotency constraint NULL-semantics (Cycle 4 verification of controller Rev.3)`

PARTIALLY RESOLVED at Cycle 4. Confirmed orders.paymentId population and orderItems's lack of a paymentId column exactly as Rev.3 claimed. But Rev.3's single 3-column unique constraint (paymentId, productId, variantId) does not protect the common case: orderItems.variantId is genuinely nullable (schema/order.ts:143-177, no .notNull()), and Postgres unique constraints treat NULL as distinct from every other NULL — two rows with identical (paymentId, productId) and variantId=NULL (any non-variant product) would not collide, silently defeating the constraint for exactly this defect's target class. RESOLVED in Rev.4: two partial unique indexes (filtered on variantId IS NOT NULL / IS NULL respectively, both also filtered on paymentId IS NOT NULL) close this correctly. Also simplified: orderItems.paymentId can be written at insert time directly, not requiring Phase 1 to enclose the later updateOrderStatus call as Rev.3 implied.

### CRIT-024 — MAJOR — Resolved in contract

Category: `REQ-007 webhook refund-logic interaction (Cycle 4 verification of controller Rev.3)`

PARTIALLY RESOLVED at Cycle 4. Confirmed switching getOrderById to findMany is mechanically sound (existingOrder used as a strictly singular object throughout the live handler, so a naive array-feed would be a compile-time break, not silent). But found a genuine new gap: the live handler's stock-insufficiency-triggered refund branch (payments/route.ts ~487-560) calls razorpay.payments.refund() for the FULL payment amount per order — a naive per-sibling-row loop would fire N duplicate refund calls against the same payment. RESOLVED in Rev.4 by scoping clarification, not new mechanism: this refund branch is itself a 'fulfillment side effect' already covered by REQ-007's reconciliation-only gate and must be skipped entirely for a Phase-1-committed order (which, post-REQ-006/010, can never legitimately have insufficient stock at this stage) — simpler than building pooled multi-row refund logic, consistent with this program's Reuse-over-new-mechanism preference. SCN-021 updated to test this explicitly.

### CRIT-025 — MINOR — Resolved in contract

Category: `REQ-014 operator visibility query-layer gap (Cycle 5)`

PARTIALLY RESOLVED at Cycle 5. getActiveAlerts/getActiveAlertsPage (monitoring-sla.ts:932-974) filter only by status/severity, no type filter — 'extend the existing surface' understated a genuine query-layer addition needed. RESOLVED in Rev.5: REQ-014 reworded to explicitly require adding a type filter parameter.

### CRIT-026 — MINOR — Resolved in contract

Category: `REQ-015 retry/analytics interaction (Cycle 5)`

Non-blocking note: a successful retry's createOrder call independently (and correctly) emits REQ-008's purchase_completed for the newly-fulfilled items — not a defect, but worth stating explicitly so it isn't mistaken for a duplicate-analytics bug during implementation/testing. RESOLVED in Rev.5 by adding this note to REQ-015.

### CRIT-027 — MAJOR — Resolved in contract

Category: `REQ-016 wrong refund-pattern citation (Cycle 5)`

BLOCKING at Cycle 5, RESOLVED in Rev.5. Direct re-read of all three originally-cited call sites (cancel-order-helper.ts:47-67, orders.ts:1797-1817, returnReplace.ts:626/719) confirmed each hardcodes a full-order-total refund amount — none supports REQ-016's own explicit, non-negotiable partial-amount requirement. The genuinely partial-capable existing pattern is src/lib/finance/refunds.ts's createFinanceRefundCase (accepts arbitrary amountPaise, routes through an existing approval-threshold check, executed via executeApprovedRefund). RESOLVED in Rev.5 by repointing REQ-016/SCN-025 to the correct pipeline — a citation correction from evidence, not a new business decision.

### CRIT-028 — MINOR — Resolved in contract

Category: `REQ-017 resolution-type enforcement (Cycle 5)`

Non-blocking limitation: the existing AlertAction type stores resolution detail in free-text reasonCode/notes, not a validated enum — the three resolution types are an application-layer convention, not schema-enforced. Acceptable for V1 given this program's smallest-safe-design instruction (a new enum column would be new schema beyond this fix's footprint); RESOLVED in Rev.5 by noting this explicitly as an implementation-time validation requirement rather than leaving it silently assumed.

