# REN-244 delayed WhatsApp alerts

## Schedule

Configure the existing external cron provider to call:

```text
GET https://<production-host>/api/cron/delayed-whatsapp-alerts
```

Schedule:

```text
0 17 * * * UTC
```

This runs daily at 23:00 Asia/Kolkata. Send the existing cron secret as:

```text
Authorization: Bearer <CRON_SECRET>
```

## Templates

- `delayed_fulfillment_digest_48h`: `HX66935bd1bb1d457b0a943640fd75b6c2`
- `delayed_delivery_digest_7d`: `HX4410ca3f94e43b70cc1d6761ddda7134`

Both templates receive one compact, single-line aggregate variable and use the authenticated `/dashboard/general/orders` page as the action button destination.

## Behavior

- Paid pending/processing orders older than 48 hours are included in the unshipped digest.
- Paid shipped orders with a shipment at least seven days old are included in the undelivered digest.
- Cancelled, delivered, failed, and RTO terminal states are excluded.
- All qualifying orders are processed; one recipient or order failure does not abort other sends.
- Per-order/per-alert/per-recipient rows are retained in `whatsapp_delayed_order_alerts` for deduplication and retry.
