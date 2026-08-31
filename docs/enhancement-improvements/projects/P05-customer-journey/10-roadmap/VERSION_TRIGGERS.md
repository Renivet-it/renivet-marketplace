# Version Triggers — P05 Customer Journey & UX

| From → To | Trigger | Evidence needed |
|---|---|---|
| V1 → V2 (order-then-pay) | Partial-order incidents continue post-V1.1 at a non-trivial rate | Production incident data after V1.1 ships (not available at documentation time) |
| V1 → V2 (webhook-as-source-of-truth) | FR-1.5 investigation finds structural conflict between webhook and client paths, not just an ownership gap | Webhook handler source review (not performed in this pass) |
| V1 → V2 (express/lightweight guest identity) | The 6 REN-95 blocking decisions land on partial identity capture rather than full guest anonymity or full account requirement | Decision-queue resolution (`07-decisions/DECISION_QUEUE.md`) |
| V2 → V3 | No trigger defined — V3 is NOT APPLICABLE until a V2 item ships and itself surfaces a further gap | N/A |
