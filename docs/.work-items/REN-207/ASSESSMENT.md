# REN-207 — Rolling 15-Day Settlement Design & Impact Assessment

## Assessment boundary

Management has selected a rolling 15-day-post-delivery direction for BIZ-17. This document is a design/impact assessment only. It does not implement rolling settlement, change payout schedules, draft seller copy, or treat Terra Luna's term as a platform-wide rule.

## 1. Timing logic

### Current fixed-window behavior

The finance model stores `cycleKey`, `cycleStart`, `cycleEnd`, and `payoutDate` in `brand_payout_cycles`. An administrator creates a cycle with explicit dates through `createPayoutCycle`; `calculatePayoutCycle()` selects delivered orders whose resolved delivery timestamp falls between the cycle start and end. The current operating convention is half-month windows such as `YYYY-MM-H1` and `YYYY-MM-H2`, with payout dates on the 1st or 16th. The cron alert path also treats the 1st and 16th as scheduled cycle days and escalates an incomplete due cycle after 18:00 IST.

An order delivered on the first day and an order delivered on the last day of the same window therefore share a payout date. The current model has no per-order due date.

### Target rolling direction

For a brand/order whose agreement uses the 15-day term, the candidate due date is `deliveryAnchor + 15 calendar days`, subject to the same eligibility, payment-state, COD reconciliation, refund, and execution controls already required by REN-204 and the payout-control workstream. The design should select due orders in a run rather than select only a calendar window. If a due date falls on a non-processing day, the implementation decision must define whether payment occurs that day or on the next operational banking day; this remains an implementation authorization decision, not an assumption in this assessment.

Worst-case lag under the target is 15 calendar days from the authoritative delivery anchor, plus only an explicitly approved operational/banking-day adjustment. The fixed-window baseline has a variable lag approaching the next half-month payout boundary and can exceed the contracted 15-day clock depending on delivery date.

## 2. Delivery-date anchor

Reuse REN-204's delivery-date resolution: the first shipment row with `status === "delivered"`, using that row's `updatedAt` as `getDeliveredAt()`. No second delivery-date resolver should be introduced. If there is no valid delivered row or the timestamp is invalid, the order remains excluded with a recorded reason and does not receive a guessed due date.

If BIZ-4 later expands the agreement universe beyond Terra Luna, the anchor remains the same only where the other agreement defines a comparable post-delivery term; the term and calendar-day interpretation must be stored per agreement/brand rather than generalized.

## 3. Existing payout-cycle dependencies

Rolling selection must preserve REN-204's payment-state rules: delivered does not mean paid; COD, cash, split, and ambiguous payment identity remain held until reconciliation; missing delivery evidence remains excluded with a reason; previously settled order IDs remain excluded. REN-203 commission validation, REN-205 holdback behavior, and REN-206 execution safety remain downstream controls and are not bypassed by being due.

The natural future candidate unit is an eligible order/item, while the existing payout summary remains brand-level for execution and statements. This requires deterministic grouping, deduplication, and a rule for whether multiple due orders for one brand can be executed together without reintroducing a date window.

## 4. Exceptions

- Cancelled before eligibility: exclude and record the cancellation reason; never create a settlement obligation.
- Returned/RTO before due date: hold or exclude according to the existing return/refund policy; do not pay an order whose payable state is no longer eligible.
- Refund after delivery but before due date: hold pending the authoritative refund state and apply the existing refund source-of-truth and payout-deduction rules.
- Refund/return after payout: retain the existing recovery/adjustment path; rolling timing does not erase post-payout recovery controls.
- Undeterminable delivery: exclude with a visible reason and operational alert/escalation; never infer delivery from order status alone.
- COD/split payment unresolved: hold under REN-204/REN-212 rules, even if the 15-day clock has elapsed.

If BIZ-4 expands scope, each exception must be evaluated against the relevant brand agreement and not assumed identical across brands.

## 5. Existing calculated cycles

The two known calculated cycles, `2026-06-H2` and `2026-07-H1`, should remain immutable legacy fixed-window artifacts. They must not be silently recomputed into rolling cycles. Before any future implementation, finance should decide whether they are:

1. left as historical calculations with a migration marker;
2. superseded by explicitly created rolling-cycle records; or
3. re-opened only through a separately approved correction workflow.

The safe default is option 1: preserve audit history and create new rolling records only after implementation approval. Existing statements, line items, audit events, and TDS reporting must continue to resolve those cycle IDs.

## 6. Seller communication requirement and trigger

During the current payout block, operations must notify affected sellers when a payout is held beyond the expected settlement date or when a missing/ambiguous eligibility input prevents settlement. The trigger is an auditable held/excluded state or an overdue payout obligation, not a guessed contract breach. Business/Legal owns the message wording and contractual interpretation; engineering should expose the trigger, affected brand/order/cycle reference, reason code, and notification status only.

If BIZ-4 expands scope, communication must be driven by the applicable brand term and must not state one universal 15-day promise.

## 7. Engineering scope, effort, and risk

This is a high-risk finance redesign. A future implementation would likely require:

- an agreement/brand settlement-policy source with effective dates;
- an order-level settlement-obligation or due-date projection;
- due-order selection and idempotent grouping into payout executions;
- concurrency protection against duplicate settlement;
- exception/hold/overdue visibility and alerts;
- statement/audit/TDS/reporting compatibility;
- migration/read compatibility for existing fixed cycles;
- staged test data and finance UAT before production enablement.

Indicative effort is multi-sprint rather than a small payout query change: discovery/contract modeling, schema and backfill design, service changes, admin/reporting changes, automated tests, staging rehearsal, and controlled rollout. The highest risks are paying too early, paying twice, applying the wrong brand term, and losing historical auditability.

## 8. Migration and backward compatibility

Do not alter existing cycle dates or mutate historical line items. New rolling records should preserve the existing cycle/line-item/audit identifiers or introduce a compatible settlement-obligation reference that downstream statements and exports can resolve. TDS and financial reports currently use `payoutDate` and `cycleKey`; they must support order due dates without changing historical report meaning. Any schema migration requires a separate implementation authorization and rollback plan.

## BIZ-4 decision sensitivity

BIZ-4 is unresolved. This assessment therefore supports two configurations:

- Terra-Luna-only: apply a 15-day policy only to Terra Luna, with other brands remaining on their documented terms until assessed.
- Multi-brand: add an effective-dated settlement policy per brand/agreement and evaluate each brand's anchor, due-date rule, exceptions, communication trigger, migration treatment, and reporting impact independently.

No conclusion is made about which brands have comparable terms.

## Go/no-go boundary

This assessment is ready for management/finance review. A separate authorization is required before any rolling settlement code, schema migration, schedule change, production data rewrite, or seller communication wording is implemented.

