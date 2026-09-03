# State Machine — P05 Customer Journey & UX

This is the most important diagram in this Epic's package. It shows the real, current (broken) checkout/payment state machine, including the error states REN-144 introduces, and where REN-95's three enforcement layers force a guest into an unwanted state transition.

## Guest vs. authenticated entry (REN-95, REN-111)

```mermaid
stateDiagram-v2
    [*] --> Browsing
    Browsing --> Cart_Guest: add to cart (guest)
    Browsing --> Cart_Auth: add to cart (authenticated)

    Cart_Guest --> MyCart_GuestView: visits /mycart\n(GuestCartPage shown, no redirect)
    Cart_Guest --> ForcedSignIn: visits /checkout\n(hard redirect, CONFIRMED)

    ForcedSignIn --> SignedIn: completes sign-in
    SignedIn --> Cart_Auth: redirect_url=/checkout honored

    MyCart_GuestView --> ForcedSignIn: attempts step 1/2 (address/payment)\nauthenticated-only per protectedProcedure

    note right of ForcedSignIn
        REN-95: this transition is the
        unwanted forced guest→login state
        change. Three layers currently
        make ANY guest path converge
        here before payment: route
        redirect, tRPC protectedProcedure,
        and orders.userId NOT NULL FK.
    end note

    note right of MyCart_GuestView
        REN-111: /mycart and /checkout
        treat the same guest differently
        on entry, converging only once
        payment is attempted.
    end note
```

## Checkout → payment → order state machine (REN-144 — the broken core)

```mermaid
stateDiagram-v2
    [*] --> CartReview
    CartReview --> IntentCreated: orderIntent.createIntent\n(ordersIntent row written)
    IntentCreated --> RazorpayOrderCreated: getShiprocketBalance\n(creates Razorpay order id)
    RazorpayOrderCreated --> PaymentSheetOpen: Razorpay Checkout.js opens

    PaymentSheetOpen --> PaymentCancelled: customer dismisses\n(ondismiss — CONFIRMED unconditional\nredirect to /mycart, REN-163)
    PaymentSheetOpen --> PaymentCaptured: customer completes payment\n(Razorpay captures funds HERE —\nbefore any order row exists)

    PaymentCancelled --> [*]

    PaymentCaptured --> Verifying: handler() calls verifyPayment(payload)
    Verifying --> VerifyFailed: signature invalid
    VerifyFailed --> [*]: error shown,\nPAYMENT CAPTURED BUT NO ORDER\n(no automated recovery — CONFIRMED gap)

    Verifying --> CreatingOrdersPerBrand: verification OK

    state CreatingOrdersPerBrand {
        [*] --> BrandLoop
        BrandLoop --> BrandOrderAttempt: for each brand group
        BrandOrderAttempt --> BrandOrderOK: createOrder succeeds
        BrandOrderAttempt --> BrandOrderFailed: createOrder throws
        BrandOrderFailed --> BrandLoop: CAUGHT AND LOGGED,\nLOOP CONTINUES\n(CONFIRMED: src/lib/razorpay/payment.ts)
        BrandOrderOK --> BrandLoop
        BrandLoop --> [*]: all brands attempted
    }

    state BrandOrderAttempt {
        [*] --> ItemLoop
        ItemLoop --> ItemOrderInsert: for each line item\n(NOT per-brand — CONFIRMED,\norders.ts per-item loop)
        ItemOrderInsert --> ItemOK: queries.orders.createOrder()\n+ orderItems insert\n(NO db.transaction)
        ItemOrderInsert --> ItemFailed: throws mid-loop
        ItemFailed --> PartialBrandOrder: earlier items already\ncommitted, later items lost\n(BROKEN STATE — REN-144 core)
        ItemOK --> ItemLoop
        ItemLoop --> [*]
    }

    CreatingOrdersPerBrand --> ZeroOrdersCreated: createdOrders.length === 0
    CreatingOrdersPerBrand --> PartialOrdersCreated: 0 < createdOrders.length < brandCount\n(BROKEN STATE, treated as success)
    CreatingOrdersPerBrand --> AllOrdersCreated: every brand/item succeeded

    ZeroOrdersCreated --> [*]: error shown to customer,\nPAYMENT CAPTURED, NO ORDERS,\nno automated reconciliation

    PartialOrdersCreated --> NotifyAndClearCart: WhatsApp + cart clear\n(runs regardless of partial state)
    AllOrdersCreated --> NotifyAndClearCart

    NotifyAndClearCart --> OrderConfirmed: redirect to /profile/orders\n"Order Placed Successfully"\nSHOWN EVEN IF PartialOrdersCreated

    OrderConfirmed --> [*]

    note right of PartialOrdersCreated
        This is the central REN-144 state:
        payment fully captured, but the
        order set is incomplete. The
        customer sees a success message
        identical to AllOrdersCreated.
        No reconciliation job reads this
        state today.
    end note

    note right of ItemFailed
        QC found this is per-ITEM, not
        per-BRAND as originally scoped —
        a single brand's multi-item order
        can itself be left partial.
    end note
```

## Target state machine (V1 fix direction — see `10-roadmap/V1.md`)

```mermaid
stateDiagram-v2
    [*] --> PaymentCaptured
    PaymentCaptured --> ReconciliationRecordWritten: durable record keyed by\nrazorpay_payment_id, BEFORE\nany order-creation attempt
    ReconciliationRecordWritten --> OrderCreationTxn: db.transaction() wraps\nALL line items, ALL brands
    OrderCreationTxn --> AllOrdersCreated: commit
    OrderCreationTxn --> TxnRolledBack: any failure\n(all-or-nothing)
    TxnRolledBack --> AutoRetryOrFlagged: automated retry,\nthen operator-visible flag\nif retries exhausted
    AllOrdersCreated --> ReconciliationRecordClosed
    AutoRetryOrFlagged --> ReconciliationRecordClosed: once resolved\n(retry success or manual repair)
    ReconciliationRecordClosed --> [*]
```
