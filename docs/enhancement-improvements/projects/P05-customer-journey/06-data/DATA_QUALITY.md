# Data Quality — P05 Customer Journey & UX

## Known data-quality risk: orphaned/partial order rows (REN-144)
QC's finding of a "new orphaned-pending-row failure mode" (per the prior portfolio pass) is consistent with what this pass confirmed structurally: a per-item loop with no transaction can leave `orders`/`orderItems` rows in an inconsistent state relative to what was actually paid for. Any remediation (FR-1.2) should include a one-time data-quality audit of existing production `orders`/`ordersIntent` rows to identify already-orphaned records before the fix ships — this audit is out of scope for this documentation pass (no production data was queried) but should be an explicit V1 task, not assumed away.

## Known data-quality risk: `ordersIntent.orderLog` as an unstructured log
Because `orderLog` is overwritten (not appended) per the code read (`db.update(...).set({ orderLog: {...} })`), only the most recent step is retained per intent row — CONFIRMED from the `.set()` call shape, though whether Drizzle/Postgres JSONB semantics here truly overwrite the whole column (versus a partial JSON merge) was not verified against the column's exact type definition in this pass (INFERRED from the mutation shape, not the schema). This matters for FR-1.3/NFR-2's auditability requirement: if history is overwritten, the record cannot answer "what were all the steps that ran," only "what was the last recorded step" — worth confirming exactly during implementation.

## Data quality relevant to REN-161
Determining the actual TRYNEW20 usage pattern (how often it's applied by genuinely new vs. returning customers) would materially inform whether FR-5.2's "add real enforcement" or "fix copy to match existing threshold-only rule" is the right business call — this is an analytics/data question for product, not something resolved by source-code inspection, and is flagged as a DECISION REQUIRED input.
