# REN-212 — COD & Split-Payment Payment-State Reconciliation Discovery

Status: `READY_FOR_DEV` for discovery documentation only. This ticket must not implement a payment-state reconciliation rule or mutate financial data.

## Scope and risk

REN-212 is an L3 financial-control discovery. Its output is an evidence-backed description of the current COD/remittance and Razorpay split-payment paths, credential/configuration gaps, duplicate COD table families, and a proposed safe BIZ-8 reconciliation rule for later implementation.

Read-only production/configuration inspection is allowed for this ticket. Production writes, carrier sync execution, credential changes, payment-status changes, remittance edits, payout execution, and refund changes are not allowed.

## Linear evidence

- REN-212 is `[FCCP][P2] Define COD & Split-Payment Payment-State Reconciliation — Discovery for BIZ-8`, Backlog, Medium priority, assigned to Ayan Ganguly, parent REN-202.
- Related work: REN-226 (refund source of truth), REN-204 (payout eligibility), and REN-224.
- BIZ-8 requires delivered **and confirmed paid**; COD/split-payment orders must never be silently treated as paid.
- The issue records that carrier credentials/configuration can be absent while COD rows retain a default zero, and that one Razorpay payment can map to multiple orders.
- Linear comments were empty during this run. The issue description and repository evidence are the available contract inputs.

## Repository evidence

### COD/remittance path

- `src/lib/finance/cod.ts` owns fee and remittance reconciliation. `syncCodReconciliationRun()` creates a `finance_cod_reconciliation_runs` run, seeds delivered COD orders, fetches Delhivery and Shiprocket rows, updates reconciliation rows, categorizes them, and emits review alerts.
- `fetchCarrierRemittanceRows()` reads `DELHIVERY_COD_REMITTANCE_URL`/`SHIPROCKET_COD_REMITTANCE_URL` and `DELHIVERY_TOKEN`/`SHIPROCKET_API_TOKEN`. If either URL or token is absent, it currently returns `[]` without a configuration-state record. This is the silent-no-op hazard described by the ticket.
- Delivered COD seeding covers a 120-day window. The newer finance table preserves a nullable remitted amount until provider evidence exists; categorization distinguishes pending/overdue/critical from an actual amount.
- `src/app/api/cron/finance/cod-remittance-sync/route.ts` exposes the sync behind `CRON_SECRET`; the fee-sync route is separate.

### Current payout gate

- `src/lib/finance/payout-eligibility.ts` holds COD, cash, split, and partial payment methods with reason `cod_reconciliation_pending`.
- Other orders are eligible only when `paymentStatus === "paid"` and a non-empty `paymentId` exists. An ambiguous payment ID also causes a hold.
- This is interim protection, not a complete BIZ-8 rule: it does not prove carrier remittance or allocate one shared payment across orders.

### Split-payment structure

- `orders.paymentId` is a non-unique indexed text column, so multiple order rows can share one Razorpay payment identifier.
- `src/lib/razorpay/payment.ts` creates one order per brand from `orderDetailsByBrand` and passes the same `payload.razorpay_payment_id` into each created order. This is the concrete path that creates one gateway payment mapped to multiple brand orders.
- A future reconciliation must use the shared payment as a payment-group identity and require explicit order-level allocation evidence; it must not assume one payment ID equals one order.

### Competing COD table families

- Legacy/order-operations family: `cod_reconciliation_runs` and `cod_reconciliation_items` in `src/lib/db/schema/order-ops.ts`. The item table has `remitted_amount` default `0`; `src/lib/db/queries/monitoring-sla.ts` still reads this family.
- Newer finance family: `finance_cod_reconciliation_runs` and `finance_cod_reconciliation` in `src/lib/db/schema/finance-compliance.ts`. The newer item table has nullable `remitted_amount_paise`, carrier/AWB, expected/actual amounts, and proof/resolution fields. `cod.ts` and `finance-compliance.ts` use this family.
- Source code cannot establish that the legacy family is vestigial in production. It must be classified by read-only production evidence before any consolidation or migration.

### Evidence limitations

- The ticket-referenced `docs/AUDIT_PROGRAM.md`, `docs/AUDIT_RUNS.md`, and `docs/RECONCILIATION_AUDIT.md` are absent from this checkout.
- Production environment values and carrier API behavior were not inspected during repository investigation. The follow-up report must classify each carrier as configured, unset, or configured-but-failing without exposing secret values.
- No carrier sync was invoked and no production database was queried.

## Requirements

- **REQ-212-001:** Document the end-to-end COD money path from delivery through carrier remittance, Renivet receipt evidence, reconciliation, and payout eligibility.
- **REQ-212-002:** Report carrier credential/configuration states and distinguish missing configuration from confirmed zero remittance; do not set or rotate credentials.
- **REQ-212-003:** Document shared Razorpay payment IDs and the evidence required for order-level split-payment confirmation.
- **REQ-212-004:** Identify both COD table families and define read-only evidence needed before choosing a source of truth.
- **REQ-212-005:** Propose a BIZ-8 reconciliation rule with pending, aging/escalation, and permanent-hold outcomes.
- **REQ-212-006:** Document that unresolved COD/split payments remain held and are not payout eligible.
- **REQ-212-007:** Keep REN-226 refund authority and BIZ-11 policy outside this discovery.
- **REQ-212-008:** Produce documentation only with no application, schema, configuration, production-data, or test changes.
- **REQ-212-009:** Define a redacted evidence artifact that distinguishes not checked, unavailable, provider failed, and checked-zero states without exposing secrets or raw sensitive payloads.
- **REQ-212-010:** Define null/state preservation and stable identity requirements for repeated carrier rows, AWB/order matches, ghost rows, and shared payment groups.

## Proposed later reconciliation rule

This is a recommendation for later implementation, not implementation in REN-212:

1. A delivered COD order enters `pending_reconciliation` and remains payout-held.
2. It becomes `confirmed_paid` only when carrier remittance evidence matches the shipment/order identity, includes a remittance reference/date, and reconciles against the approved amount/fee rule.
3. Missing configuration is `evidence_unavailable`; provider failure is `provider_unavailable`. Neither means zero remittance or paid.
4. A shared Razorpay payment ID is a payment group. Each order needs explicit persisted allocation evidence; otherwise all affected orders remain held.
5. Pending cases use the existing 14-day review and 30-day critical thresholds in `categorizeCodReconciliation()`. The exact permanent-hold duration and final escalation owner remain finance/operations decisions for implementation.
6. Payout eligibility consumes the final reconciliation outcome; `paid` alone must not bypass a COD/split hold.

The evidence artifact must contain carrier name, check timestamp, configuration state, provider result class, row count, aggregate amounts, and stable non-secret correlation identifiers. It must not contain tokens, raw payloads, full payment IDs, or unrestricted remittance references. Missing provider evidence remains `null`/unavailable in the finance model; a legacy default-zero value is not proof of remittance.

## Read-only follow-up investigation

- Classify each carrier as configured, unset, or configured-but-failing without printing secret values.
- Run a report-only configuration/provider diagnostic, never the write-capable sync. A partial carrier failure must be recorded independently, be retryable, and must not erase the successful carrier's evidence.
- Query both table families for row counts, recent writes, run status, overlap by order/AWB, and consuming code paths. Production queries must be read-only and finance-authorized.
- Group orders by `paymentId` and report shared-payment groups and available allocation evidence without exposing secrets.
- Compare delivered COD orders, remittance rows, payment status, payout-cycle membership, and audit records; do not repair rows.
- Define stable deduplication evidence for repeated provider rows and matching by carrier + AWB/order identity; do not create a second ghost row for a replay.
- Present the proposed rule and permanent-hold duration to finance/operations before implementation.

## Out of scope and safety boundaries

- No production writes; read-only production/configuration evidence is allowed. No carrier sync execution.
- No credential setup/rotation or BIZ-11 policy decision.
- No changes to payment status, remittance amounts, COD tables, refunds, payout cycles, or settlement rows.
- No COD-table consolidation, general-ledger architecture, gateway-cost capture, BIZ-9 refund reconciliation, or payout-cycle execution.

## Test expectations

Discovery-only: no application tests or migrations are required. The later implementation must test missing credentials, provider failure and partial retry, confirmed remittance versus checked-zero, null/state preservation, stable provider-row identity, split-payment grouping/allocation, aging/escalation/permanent hold, payout gating, report redaction, and read-only authorization. This ticket's verification is governance validation and review of the documentation artifacts.

## Decisions and dependencies

- **DEC-212-001 — HUMAN_CONFIRMATION:** Finance/operations must approve permanent-hold duration and escalation owner. Safe default: held/not paid.
- **DEC-212-002 — RECOMMEND_CONTINUE:** Missing carrier configuration is `evidence_unavailable`, never zero remittance or paid.
- **DEC-212-003 — RECOMMEND_CONTINUE:** Shared payment IDs are payment groups requiring explicit allocation evidence.
- **DEC-212-004 — HUMAN_CONFIRMATION:** Select the canonical COD table family only after read-only production usage/overlap evidence.
- REN-226 owns refund source of truth; REN-204 owns payout-eligibility integration; BIZ-11 remains undecided.

## Definition of done

- The money path, silent no-op finding, split-payment mapping, duplicate table families, proposed rule, interim hold guidance, limitations, and follow-up checks are documented.
- No application/database/configuration/production-data changes are made.
- Governance validation passes for the task-local contract.
