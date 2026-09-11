# Personas — P05 Customer Journey & UX

## Priya — First-time guest shopper
Found Renivet via a social ad, wants to buy one item, has never created an account on any similar site without being sure she'll return. Highest purchase intent, lowest tolerance for friction. Directly affected by REN-95 (forced login wall) and REN-111 (inconsistent guest treatment across pages).

## Arjun — Returning multi-brand shopper
Has an account, regularly buys from 2–3 brands in one cart. Because Renivet fans out one cart into multiple per-brand (per this research, per-item) orders, Arjun is the customer most exposed to REN-144: the larger and more multi-brand his cart, the more independent order-creation calls happen after his card is charged, and the more surface area for a partial failure.

## Rina — Budget-conscious repeat customer
Sees "TRYNEW20" is auto-applied and it directly affects whether she completes checkout. She is not a new customer; if the coupon's naming ("try new") implies new-customer exclusivity it doesn't enforce, this is a trust and honesty issue (REN-161), not just a UX nit.

## Deepak — Customer who changes their mind mid-payment
Opens Razorpay's payment sheet, then dismisses it to reconsider or fix something. He expects to land back where he was — a specific product's Buy-Now flow, or his reward redemption — not always the generic cart page (REN-163).

## Support agent (internal persona) — handling a "money taken, no order" ticket
Receives a ticket that a customer was charged but has no order in their account. Today, there is no reconciliation tooling or intent-log-based diagnostic surfaced to them beyond raw database inspection — this persona is the direct downstream cost of REN-144 and is why REN-101 (zero test coverage on this path) compounds the risk.
