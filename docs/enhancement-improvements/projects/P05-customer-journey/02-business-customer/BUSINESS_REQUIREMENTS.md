# Business Requirements — P05 Customer Journey & UX

## BR-1: Payment and order records must be consistent (REN-144)
Every successfully captured payment must result in a complete, correct set of order records for everything the customer paid for — never a partial or missing set. If order creation cannot complete for any part of a captured payment, the system must detect this automatically and provide an operator-visible reconciliation path, not rely on customer support escalation to discover it.

## BR-2: Guests must be able to complete a purchase (REN-95)
A first-time visitor with high purchase intent must not be forced to create an account before paying. Account creation may be offered or encouraged, but must not be the only path to checkout, once the 6 blocking product/security/finance decisions (`07-decisions/DECISION_QUEUE.md`) are resolved.

## BR-3: One checkout behavior, not several (REN-152)
A business rule (coupon eligibility, availability filtering, tax calculation) must be expressed once and apply identically regardless of which page the customer checks out from.

## BR-4: Cart must reflect checkout reality (REN-153)
If an item will be excluded or altered at checkout (unavailable, price changed, out of stock), the cart view must say so before the customer reaches checkout — not just via a silently different total.

## BR-5: Promotional copy must match promotional logic (REN-161)
Any coupon or discount presented to the customer as conditional (e.g., "new customer") must actually enforce that condition, or must not claim it in copy or naming.

## BR-6: Customers return to where they were (REN-163)
Cancelling or dismissing payment must return the customer to the flow they came from (product page, Buy-Now, reward redemption, or cart), not a default page unrelated to their context.

## BR-7: Guest treatment must be consistent across the journey (REN-108–112)
Every page a guest can reach during browse → cart → checkout must present a coherent, complete experience (header/footer present, correct page chrome, consistent redirect behavior, accessible modals) — a guest should never encounter a materially broken page as an artifact of which entry point they used.
