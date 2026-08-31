# State Machine — P06

This Epic has no product-level state machine of its own (it does not introduce a new stateful entity). The relevant "state" is the lifecycle of a single conversion event as it moves through the measurement pipeline.

## Purchase-event lifecycle (current)

```
[Order created (brand N)] --onSuccess fires--> [PostHog captured (correct value)]
                                          \----> [Pixel fired (WRONG value: paise)]
                                          \----> [CAPI call attempted]
                                                       |
                                                       v
                                          [capiLogs row written: status=success|failed, regardless of outcome]
```
Each brand-order transitions through this independently — there is no shared "checkout" state that gates or coalesces the N brand-order events into one. This is precisely the architectural gap behind REN-145b.

## Target lifecycle (V1 fix, conceptual)

```
[Checkout/payment-intent created] -> [N brand-orders created] -> [ALL N confirmed]
                                                                        |
                                                                        v
                                                          [ONE purchase_completed emitted]
                                                          [ONE Meta Purchase emitted, rupee value]
                                                                        |
                                                                        v
                                                          [capiLogs row written, keyed to checkout, not brand-order]
```
The gating condition ("ALL N confirmed") needs a concrete implementation choice (e.g., wait on `Promise.all` of the `createOrder` calls before firing tracking, rather than firing inside each individual `onSuccess`) — left to implementation, not mandated here.

## CAPI success/failure states

`sendCapiEvent` already models two terminal states (`status: "success" | "failed"`), both logged. No new states are needed for REN-145/131/133 — the fix operates on when/how many times the transition into these states occurs, not on the states themselves.
