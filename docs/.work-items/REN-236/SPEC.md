# REN-236 — RTO Payment Fee & Fault-Based Payout Allocation

## Contract

REN-236 extends the existing contracted payment-fee calculation into the payout line-item path. Forward orders retain the current fee behavior. For RTO orders, the linked `rto_dispositions.faultOwner` is the only fault input: `brand` makes the fee brand-chargeable; `customer`, `carrier`, `renivet`, `unknown`, or no disposition makes Renivet absorb it. The implementation must not read `order_return_requests.reason` or infer fault from customer input.

The existing `calculateContractedPaymentFeePaise` formula remains authoritative and already returns zero for invalid totals. Existing replace-based payout line-item calculation remains authoritative for duplicate prevention. Scope is limited to the confirmed applicable seller path (Terra Luna), existing payout records, and existing statement/admin displays.

## Requirements

- REQ-236-001: Apply the existing contracted payment fee to forward and RTO shipments in the payout calculation.
- REQ-236-002: For RTO, charge the brand only when the linked disposition has `faultOwner: brand`; otherwise absorb the fee at Renivet.
- REQ-236-003: Treat missing or unresolved RTO disposition as Renivet-absorbed and never brand-chargeable.
- REQ-236-004: Preserve non-RTO payout, commission, TDS, TCS, and holdback behavior.
- REQ-236-005: Preserve zero-fee behavior for missing, zero, negative, or non-numeric order totals.
- REQ-236-006: Preserve replace-based recalculation and exactly one payment-fee line per applicable order per cycle.
- REQ-236-007: Make line-item descriptions distinguish forward, RTO absorbed, and RTO brand-chargeable outcomes, including adjudicated fault owner where known.
- REQ-236-008: Include payment-fee lines in the existing brand payout statement deductions rendering without adding a new section or column.
- REQ-236-009: Do not read customer-supplied return reasons or implement independent fault inference.

## Scenarios

- SCN-236-001: Forward Terra Luna order produces the existing contracted fee.
- SCN-236-002: RTO with brand fault produces a brand-chargeable fee line.
- SCN-236-003: RTO with customer, carrier, Renivet, or unknown fault produces a Renivet-absorbed fee line.
- SCN-236-004: RTO with no disposition produces a safe absorbed outcome.
- SCN-236-005: Invalid order total produces no fee line and no fallback charge.
- SCN-236-006: Recalculation replaces the line-item set and does not duplicate payment fees.
- SCN-236-007: Existing non-RTO financial lines remain unchanged.
- SCN-236-008: Statement and admin views show the same outcome description.
- SCN-236-009: Customer return reason cannot affect fee chargeability.

## Invariants

- INV-236-001: `rto_dispositions.faultOwner` is the only RTO chargeability input.
- INV-236-002: Only `brand` RTO fault is charged to the brand.
- INV-236-003: Missing/unknown attribution fails safe to Renivet absorption.
- INV-236-004: Invalid totals never create a payment-fee line.
- INV-236-005: Recalculation cannot append duplicate fee lines.
- INV-236-006: Existing non-RTO payout logic is unchanged.
- INV-236-007: Display descriptions never imply brand charge from customer reason.

## Flow and Architecture

1. `calculatePayoutCycle` resolves applicable payout orders and reads the existing RTO disposition by order.
2. It calls `calculateContractedPaymentFeePaise` once for each applicable order.
3. It emits the existing `payment_fee` line type with outcome metadata and description; the existing replacement write persists the set.
4. Existing PDF and admin line-item renderers display the description; no new page or schema is introduced.

## Security and Integration

The payout calculation remains server-side and uses existing payout authorization. REN-237 remains the producer of `faultOwner`; REN-236 only consumes it. No customer-controlled field crosses into financial chargeability. Existing statement/admin rendering and PostgreSQL payout line-item persistence remain the integration boundaries.

## Test Expectations

- TEXP-236-001 unit tests for fee formula, forward/RTO outcomes, all fault owners, unknown, and no disposition.
- TEXP-236-002 integration tests for payout line-item amount, sign, metadata, and description.
- TEXP-236-003 regression tests for non-RTO payout behavior and existing commission/TDS/holdback paths.
- TEXP-236-004 integration test for invalid totals producing no fee line.
- TEXP-236-005 integration test for replace-based recalculation producing one fee line.
- TEXP-236-006 static/component coverage for statement deductions and admin descriptions.

## Exclusions

No new schema, migration, fee formula, commission/TDS/TCS/holdback rule, RTO attribution mutation, customer-reason inference, new report, dashboard section, or platform-wide seller rollout.
