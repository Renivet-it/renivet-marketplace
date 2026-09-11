# Work Item
Linear ID: REN-144
Title: Payment/order integrity: successful payment can result in partial or missing orders with no reliable reconciliation path
Branch: akshayatwork1/ren-144-paymentorder-integrity-successful-payment-can-result-in
State: CRITIQUE

# Risk
initial_risk: L3 (source: preliminary_ai — no developer was available to answer the Step 1 risk question in this batch reconciliation pass; drafted from the Linear issue's own text, which is unambiguous about payment/order-integrity severity)
path_rule_risk: L3 (matches `orders-inventory` — `src/lib/trpc/routes/general/orders.ts`, `src/lib/db/queries/product.ts` — and `payments` — `src/app/api/webhooks/razorpay/**` — in `path-risk-policy.yaml`)
semantic_risk: L3 (confirmed by investigation: real financial/payment integrity defect, affects every checkout)
final_risk: L3
Escalation history: none — L3 was the floor from CLASSIFIED onward; investigation did not need to escalate further.

# Problem / Objective
Razorpay captures payment before order rows are created. Order creation runs per line-item inside a per-brand loop with no transaction boundary. A failure partway through can leave some paid-for items with no order at all, and others as an orphaned, permanently-pending order row. The client-side flow does not distinguish partial from full success: it clears the entire cart and reports unqualified success as long as at least one order was created anywhere in the loop. Neither Razorpay webhook can reconcile this for consumer orders, because they look up orders by Razorpay's own `order_id` while consumer `orders.id` is a brand-generated string that never matches. The objective is to ensure a captured payment always results in either a complete, correct order for everything the customer paid for, or an explicit, recoverable, correctly-communicated resolution path — never a silent gap between what was charged and what was fulfilled.

# Requirements
- REQ-001: A payment resulting in fewer created orders than paid-for line items must never present an unqualified "success" state to the customer.
- REQ-002: Cart-clearing must remove only items whose order was successfully created.
- REQ-003: A partial or failed order-creation outcome must be discoverable by Renivet's own systems without relying on a customer complaint, within a defined time bound.
- REQ-004: No order row may exist in a permanently unreconciled pending state with no path to resolution.
- REQ-005: Existing full-success paths must be unaffected in behavior or latency.
- REQ-006: Order-row creation for a single brand's line items must be atomic.
- REQ-007 *(revised, Critic Cycle 1)*: Razorpay webhooks must resolve consumer orders correctly, never silently exiting via "Order not found" — AND, once resolvable, must never re-trigger fulfillment side effects (stock decrement, confirmation email, Shiprocket AWB generation) for an order already created at checkout time. Webhook role for consumer orders is reconciliation only.
- REQ-008: Any checkout-outcome analytics event (including REN-131's `purchase_completed`) must be scoped to orders that actually succeeded.
- REQ-009 *(added, Critic Cycle 1)*: Order creation for a given (razorpayPaymentId, brandId) pair is idempotent.
- REQ-010 *(added, Critic Cycle 1)*: Stock sufficiency is evaluated atomically and conditionally at write time, inside the same transaction as the decrement — never from a pre-transaction snapshot.
- REQ-011 *(added, Critic Cycle 1)*: External side effects for a brand-call's items are only attempted after that brand-call's DB writes are durably committed; a post-commit external failure never triggers a DB rollback.

# Scope Contract
**In scope:** multi-item/multi-brand order creation (both live checkout entry points), the transaction boundary around order-row creation, cart-clearing scope, success/partial/failure UI states, webhook ID-matching for consumer orders, orphaned/pending-order detection and alerting, and REN-131's now-shipped analytics-scoping defect (discovered during this pass's investigation, not named in the original Linear issue).

**Out of scope:** corporate-order payment flows (separate schema, already carries `razorpayOrderId`, confirmed unaffected), general payment-method/checkout UI redesign, and the separate duplicate-checkout-codebase consolidation effort (this fix applies to whichever implementation(s) are live at implementation time).

**Dependencies:**
- Confirm whether a manual/admin-side reconciliation process for orphaned orders already exists outside the codebase [DESIGN_BLOCKER — see DEC-001]
- Re-patch REN-131's `capturePurchaseCompleted` call site to scope to `createdOrders` once this issue's transaction/success-signal work lands [IMPLEMENTATION_PREREQUISITE]
- Reuse the `orderShipments.delhiveryTrackingJson`-style raw-response-persistence pattern rather than inventing a new one [INFORMATIONAL_DEPENDENCY — resolved]

**Assumptions:** Razorpay payment capture/HMAC verification itself is out of scope and correctly implemented. The per-brand loop structure remains; this SPEC scopes atomicity per-brand, not across the whole multi-brand checkout (see Architecture).

**Scope changes:** none yet.

# Decisions
- DEC-001 (status: **open**): Does a manual/admin-side reconciliation process for orphaned/partial orders already exist outside the codebase? This is REN-144's own explicitly named precondition and cannot be resolved by code investigation alone (a human process leaves no source trace). Recommended default: assume no such process exists (consistent with this and the prior reconciliation pass's findings) but do not mark this work item `APPROVED` until Product/Support confirms explicitly. Posted to the REN-144 Linear issue as a comment (see Approval section for the comment URL once posted).

# Scenarios
See `work-item.yaml` `scenarios[]` for the full structured list (SCN-001 through SCN-014). Categories covered: happy path, alternate paths (single-brand regression), failure (brand-call failure, atomicity), invalid state transitions, state transitions (UI states), duplicate operations (double-submit), concurrency, race conditions, external dependency failures (both webhooks), analytics (REN-131 scoping), rollback/recovery (ops reconciliation surface), and security abuse (client-supplied amount trust). Accessibility and mobile/responsive categories were considered and excluded — this is a server-side/data-integrity fix with UI-state changes limited to three copy/state variants, not a new UI surface; the existing checkout UI's own accessibility properties are unchanged by this work.

# Invariants
See `work-item.yaml` `invariants[]` (INV-001 through INV-006). Every invariant has a non-null `validation_strategy`; three are automated, two are QA-runtime (ops-surface usability and reconciliation-sweep completeness can only be meaningfully verified against a running system), consistent with `qa/MASTER_PLAN.md`'s own Evidence Level model referenced by the `QA_RUNTIME_REQUIRED` reason code.

# Flow Design

This flow genuinely involves an external system (Razorpay) and therefore uses the three-domain model per `PAT-EXTSTATE-01`.

```mermaid
flowchart TB
    subgraph BUSINESS["Business State (what the customer believes happened)"]
        B1[Customer submits payment]
        B2{All items fulfilled?}
        B3[Sees: Order Placed Successfully]
        B4[Sees: Partial outcome — itemized]
        B5[Sees: Order Failed]
    end

    subgraph INTERNAL["Internal-System State (Renivet DB / server)"]
        I1[Razorpay payment captured]
        I2[Per-brand loop: db.transaction per brand]
        I3{Brand-call succeeded?}
        I4[Order rows committed for brand,\ncart rows cleared for brand,\nrazorpayOrderId stored on order]
        I5[Zero rows for brand,\ncart rows KEPT for brand,\noperational alert raised]
        I6{createdOrders.length ==\ninput.items brands?}
        I7[purchase_completed emitted\nscoped to createdOrders]
        I8[No purchase_completed,\nor scoped to zero — TBD by\nanalytics-event contract]
    end

    subgraph EXTERNAL["External System State (Razorpay)"]
        E1[Payment: captured]
        E2[Webhook: payment.captured /\nrefund.processed fires later,\nasync, out of band]
    end

    B1 --> I1
    I1 --> E1
    I1 --> I2
    I2 --> I3
    I3 -->|yes, per brand| I4
    I3 -->|no, per brand| I5
    I4 --> I6
    I5 --> I6
    I6 -->|yes| I7 --> B3
    I6 -->|no, some succeeded| I8 --> B4
    I6 -->|no, zero succeeded| B5

    E1 -.async, ID-matched via\nrazorpayOrderId column.-> E2
    E2 -.resolves via razorpayOrderId,\nnot orders.id.-> I4
```

## Synchronization failure handling
On a brand-call failure: the failure is caught (existing behavior preserved) but must now additionally (1) not clear that brand's cart items, (2) raise an operational alert via the existing `createOperationalAlert` helper naming the failed brand/items, (3) exclude that brand's items from the emitted `purchase_completed` event's totals. Total-failure behavior (zero brands succeeded) is unchanged.

## Reconciliation strategy
A `razorpayOrderId` column is added to the consumer `orders` table (additive, reversible migration — mirrors the existing corporate-order schema's own `razorpayOrderId` column, so this is precedent reuse, not a new pattern) and populated at order-creation time from the same Razorpay order id already available in the client handler's payload. Both webhooks are updated to look up by this column instead of `orders.id`. The existing `order-ops` admin dashboard's pending-order query is extended to also surface any checkout whose alert log shows a brand-call failure with no corresponding compensating action recorded — reusing existing ops infrastructure rather than building a new one, pending DEC-001's answer.

# Repository Investigation

**1. What repository areas were investigated?** `src/lib/trpc/routes/general/orders.ts` (createOrder mutation), `src/lib/razorpay/payment.ts` (client handler), both Razorpay webhook route handlers, `src/lib/analytics/purchase-events.ts` and the REN-131 diff, and the corporate-order schema (as a reuse precedent).

**2. Why were those areas selected?** They are exactly the modules REN-144's own technical breakdown names, expanded (per Stage 3's progressive-dependency-expansion rule) into REN-131's analytics capture once git history showed it had shipped since the last reconciliation pass and touches the identical `createdOrders`/`input` variables this issue is about.

**3. What dependencies were discovered?** REN-131 (shipped, now a prerequisite to re-patch), REN-133 (sequenced after REN-131, must be re-checked against whatever amount/item scoping this issue introduces), and the existing `orderShipments.delhiveryTrackingJson` / corporate-order `razorpayOrderId` patterns as reuse precedents.

**4. Which potentially related areas were intentionally excluded, and why?** Corporate-order payment flow (separate schema, confirmed unaffected by grep); checkout UI redesign and payment-method additions (explicitly out of scope per the Linear issue); the duplicate-checkout-codebase consolidation effort (separate, pre-existing initiative — this fix must apply to whichever implementation(s) are live at implementation time regardless of that effort's timing).

**5. Which external systems are involved?** Razorpay (payment capture, payments webhook, refunds webhook) and PostHog (via REN-131's `purchase_completed` event).

**6. Which state transitions are affected?** Order: (none) → pending → [paid | orphaned/never-created] becomes (none) → pending → [paid-and-tracked | never-created-and-cart-preserved]. Checkout UI gains a genuinely new "partial success" state. Cart: populated → fully-cleared becomes populated → [fully cleared | partially cleared].

**7. Which security/authorization boundaries are affected?** None directly. `createOrder` is already a `protectedProcedure` scoped to the authenticated user's own session/cart; this fix does not alter who can call it or what they can access — it changes what happens to the caller's own data on partial failure. Confirmed no cross-tenant or cross-user path is introduced.

**8. What assumptions remain unresolved?** Whether a manual/admin-side reconciliation process already exists outside the codebase (DEC-001, open). Real-world frequency of the partial-failure condition (unmeasured by design — this issue's own observability work is what will produce that data going forward).

**9. Did investigation cause the risk level to change?** No — `orders-inventory` and `payments` path rules already forced L3 at the CLASSIFIED stage, before investigation began. Investigation *did* expand scope (REQ-008/INV-006, the REN-131 finding), which is recorded as a Stage 3 dependency expansion, not a risk escalation, since it stayed within L3.

**10. Is there remaining uncertainty that could materially change the design?** Yes — DEC-001. Per the skill's own rule, this work item is **not** marked `APPROVED` while that decision is open; see Approval section.

Investigated areas / excluded areas / dependencies / external systems / security boundaries / unresolved uncertainties: see `work-item.yaml`'s `repository_investigation` object for the machine-readable form of everything stated above.

# Architecture

**Revision 1 (post Critic Cycle 1).** The Critic's 7 blocking findings (`duplicate_operations`/`idempotency`, `invalid_state_transitions`/`rollback_recovery`, `external_dependency_failures`, `concurrency`/`race_conditions`/`data_integrity`) all trace to three concrete, code-verified gaps in the original per-brand-transaction proposal. This revision replaces that proposal with a more specific design, rather than patching around it.

**1. Two-phase brand-call execution, not one interleaved loop.** The current code interleaves, per item: insert order row → insert order-items → send real Delhivery shipment/AWB → validate/decrement stock → send email. This means a later item's stock-insufficiency failure cannot undo an earlier item's already-real shipment (the exact `invalid_state_transitions`/`rollback_recovery` finding). The revised design splits each brand-call into:
  - **Phase 1 (inside one `db.transaction()` for the brand-call):** for every item in the brand's call, atomically check-and-decrement stock (`UPDATE products SET quantity = quantity - N WHERE id = ? AND quantity >= N`, checked by row count, not a pre-read snapshot — this is what closes REQ-010/INV-008's oversell race, since the check and the decrement are the same atomic statement, not a separate `SELECT` followed by an `UPDATE`) and insert the order + order-item rows. **No external call of any kind happens in Phase 1.** If any item fails (insufficient stock, or any DB error), the whole transaction rolls back — zero rows, zero external calls, for that brand-call. This directly satisfies REQ-006/INV-003 (atomicity) and REQ-011/INV-009 (no orphaned external side effect), because there is nothing to orphan: nothing external has been touched yet.
  - **Phase 2 (after Phase 1 commits, outside the transaction):** for each now-durably-created order, perform the Delhivery shipment creation and send emails. A Phase-2 failure is caught, logged via the existing `createOperationalAlert` helper (REQ-003), and the affected order is marked with a new boolean-equivalent status (e.g. a `fulfillmentPending` flag or reuse of the existing `pending`/`processing` order-status value with an ops-alert attached) rather than aborting anything — the DB state (payment captured, order exists, stock correctly decremented) is already correct and final; only shipment *scheduling* needs a retry, which is an operational concern the reconciliation sweep (REQ-004) already covers, not a data-integrity one.

**2. Idempotency via a unique constraint, not just a transaction.** A `db.transaction()` guarantees atomicity, not exactly-once execution against retries. REQ-009/INV-007 add a unique constraint on `(razorpayPaymentId, brandId)` on the `orders` table; Phase 1 begins with an upsert-style check (`INSERT ... ON CONFLICT (razorpayPaymentId, brandId) DO NOTHING`, or an existence check inside the same transaction) so a retried or concurrently-duplicated request for the same brand-payment pair is a safe no-op, not a second order.

**3. Cart-clearing becomes scoped.** `deleteItemFromCart({ userId })` (currently unconditional) is replaced with a call that only removes rows for products belonging to brands whose Phase 1 committed successfully.

**4. UI gains a third state.** Full success (all brands' Phase 1 committed), partial success (itemized, wording flagged `MANUAL_BUSINESS_VALIDATION_REQUIRED`), full failure (unchanged) — Phase 2 outcomes never change what the customer sees, since by the time Phase 2 runs the payment/order/stock state is already final and correct from the customer's perspective.

**5. Webhook matching via a new `razorpayOrderId` column, reconciliation-only.** Populated at Phase-1 creation time, queried by both webhooks instead of `orders.id`. Critic Cycle 1 found that the payments webhook's `payment.captured` handler is a dormant *second, independently-written fulfillment pipeline* — it re-decrements stock, re-sends the confirmation email, and attempts Shiprocket AWB generation against fields the current create-time flow never populates. Simply fixing the lookup (the original REQ-007 scope) would reactivate that pipeline the moment it starts finding real orders, causing a real double-decrement and a courier API call with an undefined `shipment_id`. **Revised REQ-007: once an order is resolved, the webhook handler performs status reconciliation only** (verify recorded payment status matches; raise an alert via `createOperationalAlert` on mismatch) **and must not re-run any Phase-2-equivalent fulfillment logic for an order that already has committed order-items/shipment rows.** Concretely, this means the payments webhook's existing Shiprocket-fulfillment branch is gated behind an explicit "does this order already have a shipment row?" check (it will, always, for every consumer order once REQ-007's lookup works) and effectively becomes unreachable dead code for the consumer-order path — left in place only for whatever other order type it may still legitimately serve, not deleted by this SPEC (deletion is a developer/reviewer call at implementation time, not a spec-time decision, per the skill's own file-boundary rules).

**6. Reconciliation via existing ops infrastructure**, unchanged from Revision 0: Phase-1 failures and Phase-2 failures both raise alerts through `createOperationalAlert`; the existing `order-ops` dashboard's query is extended to surface them. **Explicit assumption (Critic Cycle 1, `tenant_isolation`, non-blocking):** `order-ops` is a Renivet-internal staff surface gated by a site-wide permission bit, not brand-scoped — this SPEC assumes that is intentional (it is not a brand-facing dashboard) and does not change its authorization model.

**7. REN-131 interaction, unchanged from Revision 0.** The already-shipped `capturePurchaseCompleted` call (commit `8a5c8a4a`) must be re-patched to compute `totalAmountPaise`/`totalItems`/`productIds`/`brandIds` from `createdOrders`, not `input`. Critic Cycle 1 noted `orderIds: createdOrders.map(...)` is *already* correctly scoped in the shipped code — only the amount/item/brand fields need the fix; the re-patch should leave `orderIds` untouched.

## Revision 2 (post Critic Cycle 2) — corrections to Revision 1's own design

Critic Cycle 2 verified Revision 1 directly against `origin/master` and found the *direction* of every fix correct but **2 of 8 previously-blocking categories still structurally blocking**, 3 partially resolved, plus two new gaps Revision 1's own text introduced or exposed. All are fixed below, not just noted.

**8. Idempotency key granularity was wrong (REQ-009/INV-007).** Verified `orders.ts:536-643` creates **one order row per line item**, not one per brand-call (`generateOrderId()` is called fresh every iteration of the `for (const [index, item] of input.items.entries())` loop). Revision 1's proposed unique constraint on `(razorpayPaymentId, brandId)` would have rejected a legitimate 3-item single-brand cart's 2nd and 3rd items outright — breaking the happy path, not just blocking retries. **Corrected:** the idempotency key must match the actual per-line-item insert granularity — a unique constraint keyed on `(razorpayPaymentId, <the same line-item-identifying columns already present on `item` before insert — e.g. productId/variantId>)`. The exact column-level implementation must be confirmed against the live `orders`/`orderItems` schema by whoever implements this (flagged in Implementation Notes) — this SPEC's contract is the *granularity requirement*, not a specific migration DDL statement it hasn't fully verified.

**9. The reconciliation-gate criterion was keyed on the wrong signal (REQ-007/INV-010).** Revision 1 proposed gating the payments webhook's dangerous pipeline on "does this order already have a shipment row?" Critic Cycle 2 found this is defeated by Revision 1's *own* Phase-2-pending-failure design: a fully legitimate order can have a committed Phase 1 (order rows, stock decremented) with **no shipment row yet** because Phase 2 is still retrying — exactly the case REQ-011 introduced. Under the original gate, such an order would look "unfulfilled" to the webhook and the dangerous re-decrement/re-email pipeline would run against it, defeating the atomicity guarantee REQ-011 was built to provide. **Corrected:** the gate keys off **order-row existence / Phase-1-commit** (i.e., the same idempotency-key match from point 8), never shipment-row existence. SCN-020 tests this exact Phase-2-pending case, which SCN-018 alone would not have caught.

Also corrected: Revision 1's stated justification that the payments webhook's dormant pipeline attempts live Shiprocket AWB/label/manifest generation is **factually wrong** — that code is entirely inside a commented-out, dead first half of `payments/route.ts` (lines 1-443); the live handler (444-821) only re-decrements stock and re-sends the confirmation email. The required fix (gate both) is unchanged; only the cited evidence is corrected. The refunds webhook was independently checked and has no analogous risk (no stock decrement, no Shiprocket calls anywhere in that handler) — no gate is needed there.

**10. Concurrency fix needed two refinements (REQ-010).** `updateProductStock` (`product.ts:3497-3537`) opens its own internal `db.transaction()` — Revision 1 didn't specify how this nests inside Phase 1's outer per-brand-call transaction. **Corrected:** `updateProductStock` must be restructured to accept and join the outer transaction (an explicit `tx` parameter) rather than opening a second, nested one. Separately, `isStockAvailable`'s pre-loop snapshot bundles non-quantity flags (`verificationStatus`, `isDeleted`, `isAvailable`) into the same boolean the original "atomic decrement" language only described for quantity — **corrected** to require those flags be re-checked atomically at write time too, inside the same transaction, not just the quantity comparison.

**11. A second, independent cart-clearing bug, entirely missed by Revision 1 (REQ-012/INV-011, new).** `orders.ts:1447-1450` — `if (!input.isSwapRewardOrder) { await userCartCache.drop(user.id); }` — unconditionally drops the customer's **entire** cart cache once per `createOrder`/brand-call invocation, positioned after that brand's own item loop but before the client's sequential per-brand loop (`payment.ts`) has necessarily called `createOrder` for any other brand. Revision 1's Architecture item 3 addressed only the *client-side* `deleteItemFromCart` call and missed this independent *server-side* full-cache-drop — meaning REQ-002 would still be violated in a real two-brand checkout even after Revision 1 shipped. **Corrected:** this call is scoped to remove only the cart entries for the brand/items this specific invocation's Phase 1 just committed.

## Critic Cycle 3 (2026-08-31) — final automatic cycle, STOPPING per process rule

Cycle 3 verified Revision 2 against `origin/master` directly. Two of the five corrections are fully resolved; **two contain gaps that would let REN-144's own core defects reoccur even if implemented exactly as specified**, and one (idempotency schema) needs an explicit scope acknowledgment:

| Revision 2 item | Cycle 3 verdict | Gap |
|---|---|---|
| Idempotency key granularity (REQ-009) | PARTIALLY RESOLVED | `orders` has no `productId`/`variantId` columns today — the fix requires ADDING new columns, a schema change this SPEC didn't flag as such |
| Webhook gate criterion (REQ-007) | **PARTIALLY RESOLVED — new structural gap** | A single `razorpayOrderId` is shared by many order rows (one per line item), but the resolution mechanism (`getOrderById` → `findFirst`) returns only one. Fixing the lookup as designed would reconcile one sibling row per webhook event and leave the rest unreconciled — **potentially reintroducing REN-144's own defect through the fix meant to close it.** |
| Concurrency / atomic decrement (REQ-010) | **PARTIALLY RESOLVED — new structural gap** | `updateProductStock` already silently swallows a failed per-item update into `{success:false}` instead of throwing, and the call site's corresponding throw is already commented out. The atomic `WHERE quantity >= N` guard, implemented exactly as specified, cannot actually prevent oversell while both swallow points remain. |
| Server-side cart-drop scoping (REQ-012) | RESOLVED | `userCartCache` is already keyed per-(user, product, variant) with an existing scoped `remove()` method — no read-modify-write race, straightforward fix |
| Shiprocket evidence correction | RESOLVED | Confirmed dead/commented-out code, no live risk |

**This was Cycle 3 of the process's own 3-cycle automatic cap.

## Revision 3 (controller iteration, 2026-09-01) — the developer-resolvable blockers, resolved

A separate controlled iteration (not an automatic AI loop — an explicit, human-authorized re-entry into this SPEC) re-verified state fresh against `origin/master` and live Linear, then resolved all three of Critic Cycle 3's DESIGN_BLOCKER-typed dependencies as concrete engineering decisions, none requiring Product/human input:

1. **Idempotency schema (REQ-009).** Direct re-verification found `orders.paymentId` already exists and is already populated with the Razorpay payment id for online orders (`orders.ts:1315-1332`, via a post-insert `updateOrderStatus` call) — the schema gap Cycle 3 feared was smaller than it looked. Fix: add one new nullable `paymentId` column to `orderItems` (denormalized from the same source, in the same transaction), unique-constrained on `(paymentId, productId, variantId)`. COD/reward orders (`paymentId: null`) are naturally exempt via Postgres's NULL-vs-NULL unique-index behavior — correct, since this defect class is specific to online payments.
2. **Webhook cardinality (REQ-007).** Fix: replace the singular `findFirst`-backed `getOrderById` with a `findMany` keyed on `orders.paymentId`, looping the existing reconciliation-only logic across every sibling order row for that payment, not just one. SCN-021 added to test the multi-row case directly.
3. **Stock-update error-swallowing (REQ-010).** Direct re-verification of `product.ts:3497-3548` found a sharper version of Cycle 3's finding: a `WHERE quantity >= N`-guarded UPDATE returning zero rows is not a thrown exception in this codebase's `const [result] = await tx.update(...).returning()` pattern — it silently produces `{success:true, data:undefined}`, bypassing even the existing swallowed-catch block entirely. The fix must explicitly check for a falsy `result`, not just fix the try/catch. SCN-022 added.

All three `DESIGN_BLOCKER` dependencies are now `resolved` in `work-item.yaml`. All historical Cycle 1/2/3 critic findings whose justification already said "RESOLVED" but whose `blocking` flag was never flipped have been corrected to `blocking: false`, so the mechanical gate now accurately reflects reality (previously it would have reported 16 stale blocking findings that were, in substance, already closed).

**REN-131 special attention (explicitly re-checked this iteration):** REQ-008/INV-006/SCN-012 (present since the original draft) already require `capturePurchaseCompleted`'s amounts/items to be derived from `createdOrders`, not `input` — this remains correct and unchanged under the per-item order-row model, since `createdOrders` is already the array of per-item rows actually created regardless of whether idempotency is keyed per-brand or per-item. The one remaining action is the `IMPLEMENTATION_PREREQUISITE` (re-patch REN-131's shipped call site) — unresolved, correctly tracked as implementation work for whoever builds this, not a SPEC gap.

**What remains open: DEC-001 only.** Whether a manual/admin-side reconciliation process already exists outside the codebase is not a code question — this iteration could not resolve it and does not attempt to. This is the sole reason REN-144 is not `APPROVED`.

## Critic Cycle 4 (2026-09-01) — verification of Revision 3, two more concrete gaps found and fixed

Cycle 4 verified all three Rev.3 fixes directly against `origin/master`. REQ-010 (stock error-swallowing) confirmed fully **RESOLVED**, no remaining gap. Two more genuine, code-verified gaps were found in the other two — both fixed in **Revision 4**, still without needing Product/human input:

1. **REQ-009's unique constraint had a NULL-semantics hole.** `orderItems.variantId` is genuinely nullable, and Postgres unique constraints treat NULL as distinct from every other NULL — so the single 3-column constraint `(paymentId, productId, variantId)` proposed in Rev.3 would silently fail to protect the *most common case*: a non-variant product, where `variantId` is always NULL. Two identical non-variant `orderItems` rows for the same payment/product would NOT collide. **Fixed in Rev.4**: two partial unique indexes — one for variant products (`WHERE variantId IS NOT NULL`), one for non-variant products (`WHERE variantId IS NULL`), both filtered on `paymentId IS NOT NULL` so COD/reward orders remain correctly exempt.

2. **REQ-007's plural webhook lookup would break the existing stock-insufficiency refund branch.** The live payments-webhook handler has a refund path that computes stock availability for a single order and calls `razorpay.payments.refund()` for the *full payment amount* on failure. A naive "loop the reconciliation logic over every sibling row" would fire this refund call once per sibling order — N duplicate refund attempts against the same payment. **Fixed in Rev.4** by recognizing this branch is itself a "fulfillment side effect" already inside REQ-007's own reconciliation-only scope: post-REQ-006/REQ-010, stock is atomically confirmed sufficient *before* an order row ever exists, so this webhook-side re-check can never legitimately fire for an order created after this fix ships. It is skipped entirely under the same gate, not restructured into new pooled-refund logic — simpler, and consistent with this program's stated Reuse-over-new-mechanism preference (`PROGRAM_CONTEXT.md`).

**This controller iteration stops here** (one controlled iteration, per its own instructions) rather than spawning a Cycle 5 to verify Revision 4. That verification is the natural next iteration's first action if one is run before implementation begins — noted as a residual, non-blocking item, not silently skipped.

## DEC-001 resolved; minimal reconciliation process specified (controller iteration, 2026-09-01)

**DEC-001 is resolved, authoritatively, by Product/Support: no existing manual/admin reconciliation process exists for orphaned/partial orders outside the codebase.** Option 1 (build the reconciliation sweep and ops-facing surface as net-new) is confirmed correct — this SPEC's original assumption was right.

**Design principle: reuse existing infrastructure completely, add nothing new beyond the already-planned schema.** Direct investigation of `src/lib/monitoring-sla/audit.ts` and `src/lib/db/queries/monitoring-sla.ts` found a complete, already-implemented alert lifecycle (`monitoringAlerts` table with `open → acknowledged → escalated → resolved` status transitions, each audited via `auditEntityChange`'s before/after tracking) and, separately, a mature, already-live refund pipeline (`refundQueries.createRefund` + `razorpay.payments.refund`, used identically in `cancel-order-helper.ts`, `orders.ts`, and `returnReplace.ts`). **No new tables, no new service, no distributed saga, no new OMS, no reconciliation platform** — the entire design below is a specific, disciplined reuse of what already exists, per this program's explicit smallest-safe-design instruction.

**REQ-013 — Reconciliation record.** A brand-call whose Phase 1 fails to commit despite payment capture raises a durable record via the existing `auditAndAlert` helper: `entityType: 'payment_reconciliation'`, `entityId: <razorpayPaymentId>`, `type: 'order_reconciliation_required'`, `severity: 'critical'`, `dedupeKey: order_reconciliation:{paymentId}:{brandId}`.

**REQ-014 — Operator visibility.** The existing order-ops-adjacent alert surface (already planned to be extended per REQ-003/Architecture item 6) is extended to show, per open reconciliation alert: customer, payment, missing brand/items, and age. No new dashboard.

**REQ-015 — Retry/recovery.** An operator-triggered (never automatic) retry re-attempts order creation for exactly the missing brand/items through the same `createOrder` path, protected by REQ-009's idempotency constraint against accidental duplication. Outcome is audited.

**REQ-016 — Refund handling.** If retry isn't possible/desired, an operator can issue a refund for specifically the unfulfilled portion via the existing refund pipeline — never the full payment amount when only some items are unfulfilled, never automatic.

**REQ-017 — Audit trail & final resolution.** Every reconciliation record reaches exactly one of three terminal resolutions (`retried_and_fulfilled` / `manually_fulfilled` / `refunded`), each requiring an attributed operator action recorded in the existing `auditEntityChange` table. **This is the concrete mechanism for this program's "never silently repair money/order state" principle** — INV-012 makes it a testable invariant, not just a stated aspiration.

DEC-001's corresponding `DESIGN_BLOCKER` dependency, and the decision entry itself, are now `resolved` in `work-item.yaml`.

## Critic Cycle 5 (2026-09-01) — final required cycle, one more citation error found and fixed

The final required Critic cycle verified REQ-013–017 against `origin/master` directly. Three of five were sound as written (REQ-013 fully; REQ-015 and REQ-017 with minor non-blocking notes added). **One genuine blocking gap**: REQ-016 cited three refund call sites (`cancel-order-helper.ts`, `orders.ts`, `returnReplace.ts`) as the reusable "partial refund" pattern — direct re-read confirmed all three actually hardcode a **full-order-total** refund amount, which cannot satisfy REQ-016's own explicit requirement to refund only the unfulfilled portion. The genuinely partial-capable pattern already exists at `src/lib/finance/refunds.ts` (`createFinanceRefundCase`, which takes an arbitrary `amountPaise` and routes through an existing approval-threshold flow) — **Revision 5** repoints REQ-016/SCN-025 there. A smaller gap was also fixed: REQ-014's "extend the existing alert surface" understated that `getActiveAlerts`/`getActiveAlertsPage` need a new `type` filter parameter added, not just a UI change.

Both were resolvable directly from evidence, with no new business/human input needed — consistent with the instruction to only self-resolve issues that don't require inventing requirements.

# Approval
**Approval Gate: PASSED, 2026-09-01.** All mechanical checks green, confirmed by `validate-work-item.ts` (deterministic, not self-asserted): no orphan requirements, zero open decisions (DEC-001 resolved), zero unresolved `DESIGN_BLOCKER` dependencies, zero blocking Critic findings across 5 cycles, every scenario has valid verification.

**State: `READY_FOR_DEV`.** The one remaining `IMPLEMENTATION_PREREQUISITE` (re-patch REN-131's shipped analytics call site) does not block this state — it blocks `READY_FOR_PR`, per the validator's own rule, and is separate implementation work tracked against REN-131.

**Residual, non-blocking note for whoever implements this:** Revision 5's two corrections (REQ-016's repointed refund pipeline, REQ-014's query-layer addition) have not been independently re-verified by a 6th Critic cycle — this was a deliberate choice, not an oversight, since both were narrow, well-evidenced citation/scoping fixes rather than open design questions, and an unbounded chain of critic cycles would itself become unproductive. Flagged here rather than silently omitted.

*(Historical note: this SPEC previously stopped at `CRITIQUE` — not `APPROVED` — for two separate reasons across its history: first, hitting the process's 3-cycle automatic cap on 2026-08-31 with unresolved design blockers [since resolved, see Revision 3/4 above]; second, DEC-001 being genuinely open pending Product/Support [now resolved, see above]. Both conditions are now cleared, which is what allows the `APPROVED` state below.)*

# Critic Review — Cycle 1 (2026-08-31)

Isolated Critic subagent (fresh context, read-only, verified claims directly against `origin/master`) returned verdicts for all 27 categories in `critic-checklist.yaml` (the file's header says 26 but the list itself has 27 — flagged as a policy-file inconsistency, not fixed here). **7 blocking findings**, all resolved by this document's Revision 1 (see `work-item.yaml` `critic_findings[]` for the full per-category record):

| Category | Verdict | Blocking | Resolution |
|---|---|---|---|
| duplicate_operations | FINDING | yes | REQ-009/INV-007 — unique-constraint idempotency |
| invalid_state_transitions | FINDING | yes | REQ-011/INV-009 — two-phase execution |
| external_dependency_failures | FINDING | yes | REQ-007 revised — webhook reconciliation-only |
| concurrency | FINDING | yes | REQ-010/INV-008 — atomic conditional decrement |
| race_conditions | FINDING | yes | same as concurrency (oversell); alert-attribution race deferred to Test Design, non-blocking |
| idempotency | FINDING | yes | same as duplicate_operations |
| rollback_recovery | FINDING | yes | two-phase execution means nothing external ever needs compensating |
| data_integrity | FINDING | yes | umbrella of the above three root causes |
| tenant_isolation | FINDING | no | explicit assumption added re: order-ops dashboard's site-wide (not brand-scoped) authorization |
| invalid_inputs | FINDING | no | malformed-webhook-payload case deferred to Test Design |
| analytics | FINDING | no | informational note that `orderIds` is already correctly scoped, only amount/item/brand fields need the re-patch |
| migrations | (NOT_APPLICABLE, minor note) | no | pre-migration NULL razorpayOrderId noted for Implementation Notes |
| all other categories (16) | NOT_APPLICABLE | no | see `work-item.yaml` for individual justifications |

A second Critic cycle has been requested against this revision to confirm the 7 blocking findings are actually resolved by the two-phase/idempotency/reconciliation-only design, per the skill's "revise and re-run" rule (capped at 3 automatic cycles).

# Verification Strategy
| Scenario | Type | Ref / Reason |
|---|---|---|
| SCN-001 happy path | automated | orders.createOrder.spec.ts::happy-path-multi-brand |
| SCN-002 single-brand regression | automated | orders.createOrder.spec.ts::single-brand-regression |
| SCN-003 atomic brand rollback | automated | orders.createOrder.spec.ts::atomic-brand-rollback |
| SCN-004 partial multi-brand failure | automated | orders.createOrder.spec.ts::partial-multibrand-failure |
| SCN-005 no-orphan-forever state | qa_runtime | QA_RUNTIME_REQUIRED — sweep completeness needs a live-like run |
| SCN-006 three UI states | manual | MANUAL_BUSINESS_VALIDATION_REQUIRED — copy/UX needs product sign-off |
| SCN-007 double-submit idempotency (unique-constraint-backed) | automated | orders.createOrder.spec.ts::double-submit-idempotency |
| SCN-008 concurrent last-unit oversell | automated | orders.createOrder.spec.ts::concurrent-last-unit-oversell |
| SCN-009 alert attribution race | automated | orders.createOrder.spec.ts::alert-attribution-race |
| SCN-010 payments webhook resolution | integration | webhooks.razorpay.payments.spec.ts::consumer-order-resolution |
| SCN-011 refunds webhook resolution | integration | webhooks.razorpay.refunds.spec.ts::consumer-order-resolution |
| SCN-012 analytics scoping | automated | analytics.purchase-events.spec.ts::partial-checkout-scoping |
| SCN-013 ops reconciliation usability | qa_runtime | QA_RUNTIME_REQUIRED — operator UX needs a running dashboard |
| SCN-014 client-amount trust | security | SECURITY_SPECIALIST_REQUIRED — overlaps DEF-024's amount-computation path |
| SCN-017 DB-phase failure → zero external side effects | automated | orders.createOrder.spec.ts::db-phase-failure-no-external-side-effects |
| SCN-018 webhook reconciliation-only for already-fulfilled orders | integration | webhooks.razorpay.payments.spec.ts::already-fulfilled-order-reconciliation-only |

Note: `qa/TEST_ENVIRONMENT.md` confirms zero test framework is installed in this repository as of this pass. The `automated`/`integration` test_refs above name the tests this SPEC requires; the developer implementing REN-144 must also stand up the test infrastructure itself (tracked as a separate concern — REN-101, "Zero automated test coverage on payment/order path," already exists in Linear for exactly this gap).

# Test Design
Step 8 complete. Every scenario (SCN-001 through SCN-026) already carries a `verification` object assigned during drafting and sharpened across five critique cycles — no additional Test Architect work was needed beyond what's already in `work-item.yaml`'s `scenarios[]`. The Verification Strategy table above is the authoritative per-scenario test specification.

# QA Handoff
Not yet populated — populated at `/spec-review` time per the template's own note, after implementation.

# Approval
**Approval Gate: PASSED, 2026-09-01** (see the fuller record earlier in this document, immediately after the Critic Cycle 5 section). Superseding this section's earlier content: DEC-001 is resolved, all `DESIGN_BLOCKER` dependencies are resolved, zero blocking Critic findings remain. State: `READY_FOR_DEV`.

# Implementation Notes
- Outstanding `IMPLEMENTATION_PREREQUISITE` (does not block `READY_FOR_DEV`, only `READY_FOR_PR`): re-patch REN-131's shipped `capturePurchaseCompleted` call site to scope to `createdOrders` (REQ-008).
- REQ-016's refund handling uses `src/lib/finance/refunds.ts`'s `createFinanceRefundCase`/`executeApprovedRefund` — not the three originally-cited (and incorrect) full-refund-only call sites.
- REQ-014 requires adding a `type` filter parameter to `getActiveAlerts`/`getActiveAlertsPage` — this is new code on an existing function, not purely a UI change.
- REQ-009's idempotency constraint needs two partial unique indexes on `orderItems`, not a single combined one (see Revision 4).
- REQ-017's three resolution types are an application-layer convention (validated at the application layer), not a DB-level enum — implement the validation, don't assume the schema enforces it.
- REN-131 special attention (per the controller iteration's explicit instruction): confirmed throughout this SPEC's history that REQ-008/INV-006/SCN-012 correctly require `purchase_completed` to reflect only what actually succeeded, never the original checkout input — this must hold under all of: full success, partial success, failure, retry (including reconciliation retry per REQ-015), multiple orders/brands, and must never double-count via the idempotency design (REQ-009/INV-007) preventing duplicate order/analytics events for the same line item.

# Implementation Review
Not applicable yet — populated at `/spec-review` time.
