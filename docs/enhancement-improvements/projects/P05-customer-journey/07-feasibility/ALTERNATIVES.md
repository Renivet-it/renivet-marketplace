# Alternatives Considered — P05 Customer Journey & UX

## REN-144: alternatives to transaction + reconciliation record
- **Alternative A — Move order creation before payment capture (order-then-pay)**: would eliminate the "payment captured, order missing" state entirely by construction (order exists first, payment attaches to it). Rejected as out-of-scope for this documentation pass to recommend outright — it is a bigger architectural change (affects inventory reservation, cancellation-of-unpaid-orders handling) than the evidenced fix, and is flagged as a DECISION REQUIRED alternative worth product/architecture evaluation rather than assumed away (see BRule-1).
- **Alternative B — Idempotent webhook-only order creation**: make the Razorpay webhook the sole creator of orders (client never creates orders directly), using Razorpay's payment event as the trigger. Would resolve the two-writers problem (FR-1.5) directly but depends on webhook reliability/latency being acceptable for a synchronous "your order is confirmed" UX — not evaluated against Razorpay's actual delivery SLAs in this pass.
- **Selected direction (V1)**: harden the existing client-driven path with a transaction and reconciliation record (lowest-risk, incremental, ships fastest) while treating A and B as V2+ considerations if the transaction-boundary fix alone proves insufficient in production.

## REN-95: alternatives to full guest checkout
- **Alternative — Express/social checkout only (no full account, but not fully anonymous either)**: some marketplaces offer a lightweight identity capture (email + OTP) as a middle ground between forced full account creation and fully anonymous guest orders. Not evaluated in depth here — this is exactly the kind of question the 6 blocking decisions likely cover, and is noted as a candidate answer, not a recommendation.

## REN-152: alternative to full consolidation
- **Alternative — Leave three implementations, add a shared lint/test rule to catch drift**: lower effort, but does not remove the underlying maintenance cost (still three places to fix bugs), only detects when they diverge. Rejected as inferior to consolidation given REN-152's High priority and the concrete cost already observed (three copies of TRYNEW20 logic to keep in sync for REN-161's fix).
