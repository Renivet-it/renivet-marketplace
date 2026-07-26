# Email audit copies

Set this server environment variable in the environment that sends production
emails:

```env
EMAIL_AUDIT_BCC=ayanganguly333@gmail.com
```

The recipient is added as a blind-copy recipient. Customers and brands do not
see this address. Leave the variable unset to stop audit copies immediately.

## Scenarios covered

| Audience             | Scenario                                                              | Subject                         |
| -------------------- | --------------------------------------------------------------------- | ------------------------------- |
| Customer             | Order placed                                                          | `Order Placed Successfully`     |
| Brand                | New marketplace order                                                 | `New Order Received: {orderId}` |
| Customer             | Order delivered                                                       | `Your Order Has Been Delivered` |
| Customer             | Refund initiated                                                      | `Order Refund Initiated`        |
| Customer             | Refund processed                                                      | `Refund Processed Successfully` |
| Customer             | Refund failed                                                         | `Refund Processing Failed`      |
| Customer             | Payment failed                                                        | `Order Payment Failed`          |
| Brand                | Subscription started                                                  | `Subscription started`          |
| Brand                | Subscription renewed                                                  | `Subscription renewed`          |
| Brand                | Subscription cancelled                                                | `Subscription cancelled`        |
| Corporate customer   | Corporate order received, dispatch ready, delivered, balance reminder | Order-status-specific subject   |
| Corporate operations | New corporate order, dispatch ready, replacement request              | Order-status-specific subject   |
| Customer             | Reward stamp earned, reward unlocked, reward redeemed                 | Reward-status-specific subject  |

This only sends copies of new emails after the variable has been configured;
it cannot retrieve messages that were already delivered in the past.
