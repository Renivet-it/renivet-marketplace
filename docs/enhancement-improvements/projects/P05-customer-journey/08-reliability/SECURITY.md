# Security — P05 Customer Journey & UX

## Scope note
This file covers PII and financial-data handling within the checkout/payment flow this Epic owns. It does not cover the unauthenticated-endpoint class of findings (REN-93/94-style) — those are a different defect class owned by the Security & Compliance Audit project, referenced here only where directly relevant.

## PII in the checkout flow (CONFIRMED handling, not independently security-tested in this pass)
- Delivery address (name, phone, street, city, state, zip) flows from `selectedShippingAddress` into Razorpay's `notes`/`prefill` fields (client-side, sent to Razorpay directly — standard for prefill, but means Renivet's checkout code does construct and transmit a PII string to a third party on every checkout: `deliveryAddress.street + ", " + city + ...` in `src/lib/razorpay/payment.ts`).
- Customer email, phone, name also flow into Meta CAPI (`trackPurchaseCapi`, `trackInitiateCheckoutCapi`) and WhatsApp notification calls. These are third-party data flows already part of normal operation; this pass did not evaluate whether they are hashed/handled per Meta's CAPI PII requirements (UNKNOWN, not traced) — flagged as worth a dedicated look if not already covered by the Security & Compliance Audit project.

## Financial-data handling
- Razorpay payment IDs and order IDs are passed through client → server (`razorpayOrderId`, `razorpayPaymentId` in the `createOrder` tRPC input) rather than being solely server-derived. `verifyPayment(payload)` (called before order creation, per `04-architecture/DATA_FLOW.md` step 7) is the integrity check relied upon to prevent a client from fabricating a payment ID — its implementation was not opened in this pass (UNKNOWN whether it performs full Razorpay signature verification server-side, or trusts client-supplied data more than it should). This is directly relevant to REN-144: if `verifyPayment` is weak, the reconciliation record proposed in FR-1.3 must not blindly trust client-supplied payment IDs as the sole key.

## Cross-referenced findings (owned elsewhere, cited for context)
- **REN-101** (zero automated test coverage on the payment/order path, Security & Compliance Audit project) directly explains why REN-144's failure mode went undetected for as long as it did — untested code paths with silent-failure design (catch-and-continue) are exactly where coverage gaps hide correctness bugs longest. This Epic does not own closing REN-101, but NFR-6 requires this Epic's own REN-144 fix to ship with at least targeted regression tests proving the new transaction/reconciliation behavior.
- **DEF-009** (unauthenticated `/api/permission` PII leak) and **DEF-010** (cross-tenant privilege escalation) are untracked P0 security risks from `08-risks/PORTFOLIO_RISK_REGISTER.md`. Neither is checkout-specific, so both are out of this Epic's scope, but are noted because any guest-checkout implementation (REN-95) that introduces new unauthenticated or lightly-authenticated endpoints should be designed with DEF-009's lesson in mind (an unauthenticated endpoint returning full PII) as a cautionary precedent, not repeated.

## Recommendation for REN-95 guest checkout security review
Whatever guest-identity mechanism is chosen (FR-2.3) should go through the same SPEC→REVIEW→TEST governance process referenced in `09-governance/` given it introduces a new authorization surface for order creation — this is exactly the class of change that produced DEF-010 elsewhere in the portfolio (missing tenant/ownership checks on a new or under-reviewed code path).
