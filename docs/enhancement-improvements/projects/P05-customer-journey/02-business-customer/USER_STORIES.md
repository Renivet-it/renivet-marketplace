# User Stories — P05 Customer Journey & UX

These are customer/business-outcome stories, not engineering tasks. Engineering requirements (e.g., "wrap order creation in a `db.transaction`") live in `03-requirements/FUNCTIONAL_REQUIREMENTS.md`.

## Guest checkout (REN-95)
- As a guest shopper, I want to complete checkout without being forced to create an account, so I don't abandon my cart at the point of highest intent.
- As a guest shopper who does create an account during checkout, I want my in-progress cart and address to carry over, so I don't have to re-enter everything.

## Payment and order integrity (REN-144)
- As a customer, I want my order confirmation to reflect everything I paid for, so I never discover a missing item only after checking my order history.
- As a customer whose payment succeeded but whose order didn't fully go through, I want Renivet to detect and fix this automatically (or proactively contact me), so I don't have to notice the discrepancy and raise a support ticket myself.
- As a support agent, I want a reliable way to look up what happened to a specific captured payment, so I can resolve "I was charged but have no order" tickets without manual database digging.

## Consistent checkout behavior (REN-152)
- As a customer, I want the same coupons, taxes, and item availability rules to apply no matter which page I check out from, so the total I see is always trustworthy.

## Cart transparency (REN-153)
- As a customer, I want to see when a cart item is unavailable before I reach checkout, so I'm not surprised by a changed total.

## Honest promotions (REN-161)
- As a customer, I want promotional copy to reflect the actual eligibility rules of a coupon, so I'm not misled about why a discount applied (or didn't).

## Returning to context (REN-163)
- As a customer who cancels payment, I want to return to where I was — the product, the Buy-Now flow, or my reward redemption — so I can pick up where I left off instead of restarting from my cart.

## Guest experience consistency (REN-108–112)
- As a guest shopper, I want every page in the browse-to-checkout journey to look and behave like a finished product, so a missing header or mismatched tab title doesn't make me question whether the site is trustworthy.
- As a guest shopper using a screen reader, I want dialogs like the search modal to be properly described, so I can use them without confusion.
