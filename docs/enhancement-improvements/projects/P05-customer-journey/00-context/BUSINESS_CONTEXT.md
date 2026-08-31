# Business Context — P05 Customer Journey & UX

## Why this Epic exists

Renivet is a multi-brand marketplace: a single customer cart can contain items from several independent brands, each fulfilled and paid out separately. The checkout flow is therefore inherently more complex than a single-seller cart — one checkout action fans out into one order per brand (and, per the code, per line item — see `01-research/RESEARCH_SUMMARY.md`), each carrying its own payment allocation, tax line, and coupon-discount share.

The purchase journey is the point where marketplace complexity, real money movement, and customer trust intersect. A defect here is qualitatively worse than a defect in browsing or search: it either costs a customer money/trust directly (a captured payment with no order) or costs Renivet revenue and support load (silent order loss, no reconciliation path).

## Business objective (CONFIRMED, from prior portfolio-governance pass)

Make the guest and authenticated purchase journey — browse → cart → checkout → payment → confirmation — correct, honest, and consistent.

- **Correct**: payment capture and order creation are atomic and reconcilable; cart totals reflect what will actually be charged; availability is shown before, not just at, checkout.
- **Honest**: promotional copy (e.g., TRYNEW20) matches its actual eligibility logic; page titles and UI chrome match the page's actual function.
- **Consistent**: the same guest-vs-authenticated rules apply across every entry point into the journey (cart, checkout, wishlist, search modal).

## Business stakes

- **REN-144 (payment/order integrity)** is financial and legal exposure: a customer can be charged via Razorpay while Renivet's own database has no matching order, or only a subset of the ordered line items recorded as orders. This is a chargeback, refund-support, and trust risk on every affected transaction, not a rare edge case — see `01-research/RESEARCH_SUMMARY.md` for why the code makes this a structural (not occasional) risk.
- **REN-95 (guest checkout login wall)** is a conversion/revenue question: every guest who reaches `/checkout` is hard-redirected to sign-in with no guest-checkout path at all (CONFIRMED, see evidence index). Industry pattern strongly favors guest checkout as a conversion lever; Renivet currently forces account creation at the point of highest purchase intent, which is scoped as the largest single-effort item in the reconciled portfolio precisely because removing it requires coordinated changes across routing, API authorization, and schema.
- **REN-152 (duplicated checkout logic)** is a maintainability and correctness-drift risk: bug fixes and business-rule changes (like the TRYNEW20 coupon, or availability filtering) must currently be applied in multiple independent places, and this pass found the duplication is broader than the two-implementation framing originally used (see `01-research/RESEARCH_SUMMARY.md`).

## Non-goals for this Epic

- Building new merchandising/promotions capability (REN-161 is a disclosure fix to an existing rule, not a new pricing-rules engine).
- AI/ML features in the purchase journey — see `07-feasibility/FEASIBILITY_ASSESSMENT.md` for why this Epic is explicitly not an AI opportunity.
- Fixing the unauthenticated-endpoint class of security findings (REN-93/94) — different defect class, different owner (Security & Compliance Audit project).
