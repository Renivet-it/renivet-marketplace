# Guest journey suite

These journeys are read-only and run only against a local or explicitly approved staging origin.
They intentionally stop before authentication, form submission, cart mutation, or payment.

1. Homepage renders
2. Shop catalog renders
3. Search results route renders
4. Product detail renders
5. Brand shop renders (using the configured public path)
6. New arrivals renders
7. Blog index renders
8. Sign-in wall is reached from a protected profile route
9. Cart route reaches the sign-in wall
10. Checkout route reaches the sign-in wall; no Razorpay interaction is attempted

The executable route definitions live in `tests/e2e/guest-journeys.ts`.
