# REN-244 — Daily WhatsApp alerts for delayed fulfillment orders

## Goal

At 23:00 Asia/Kolkata each day, identify all paid orders requiring fulfillment follow-up and send one auditable WhatsApp alert per order and alert type to each of the existing three configured recipients.

## Linear context

- Issue: REN-244
- Title: Daily WhatsApp alerts for delayed fulfillment orders
- Status: Backlog
- Priority: No priority
- Linear branch context: `ayanganguly333/ren-244-daily-whatsapp-alerts-for-delayed-fulfillment-orders`
- Repository branch observed: `feat/ren-203-spec` (does not match the Linear branch context; implementation must preserve this fact and must not rewrite Git metadata through the application workflow).
- Comments and relations: none returned by Linear.

## Repository evidence

- Orders use `paymentStatus` values including `paid` and order `status` values `pending`, `processing`, `shipped`, `delivered`, and `cancelled` (`src/lib/db/schema/order.ts`).
- Shipments are one-per-order and expose `status`, `shipmentDate`, `awbNumber`, `trackingNumber`, and timestamps (`src/lib/db/schema/order-shipment.ts`).
- Existing shipment webhook notifications use `sendWhatsAppMessage` and `whatsappMessageLogs`, but their deduplication identity is recipient + template key/name, not order + alert type (`src/lib/whatsapp/order-status.ts`, `src/lib/db/queries/whatsapp.ts`).
- Existing WhatsApp log rows have no order ID, alert type, retry state, or unique idempotency key (`src/lib/db/schema/whatsapp.ts`, `drizzle/0226_whatsapp_message_logs.sql`).
- Existing configured-recipient resolution for operational WhatsApp alerts is in `monitoringSlaQueries` and falls back to `DEFAULT_*_WHATSAPP_NUMBERS`; REN-244 requires the existing three configured recipients to be resolved once and fan-out per qualifying order (`src/config/whatsapp-notifications.ts`, `src/lib/db/queries/monitoring-sla.ts`).
- Cron endpoints use `requireCronSecret`, which accepts only the `Authorization: Bearer <CRON_SECRET>` header (`src/lib/auth/cron-access.ts`).
- Existing URLs use runtime configuration such as `NEXT_PUBLIC_APP_URL`/Vercel URL rather than hard-coded hosts (`src/lib/whatsapp/order-status.ts`).

## Scope and design

- Add a daily scheduled endpoint under the existing `/api/cron` convention, protected by `requireCronSecret`.
- Configure the schedule as `0 17 * * *` UTC, equivalent to 23:00 Asia/Kolkata year-round, in the repository's scheduler configuration. The job also records the evaluated timezone/window in structured logs so manual invocations are diagnosable.
- Define alert types `unshipped_48h` and `undelivered_7d`.
- Candidate `unshipped_48h`: `paymentStatus = paid`, order status is not `cancelled` or `delivered`, no shipment has reached a shipped state, and `orders.createdAt <= now - 48h`. Because the schema has no `ready` state, `pending` and `processing` are the supported equivalent; no new order status is invented.
- Candidate `undelivered_7d`: `paymentStatus = paid`, order status is `shipped`, shipment status is not `delivered` or `cancelled`, `shipmentDate` is present and `shipmentDate <= now - 7d`.
- Exclude cancelled and delivered orders in both candidate queries, and exclude RTO/failed/cancelled shipment states from the shipped-but-undelivered alert unless repository evidence shows they are active delivery states.
- Build one aggregated template payload per alert type and recipient containing every qualifying order's order ID, product title/details, quantity, current status, shipment date when available, AWB/tracking number, and tracking URL when available. Use the existing authenticated `/dashboard/general/orders` admin page as the CTA destination; the message list is compact and bounded, and oversized runs are split into numbered batches.
- Reuse the existing Twilio template sender with the approved templates `delayed_fulfillment_digest_48h` (`HX66935bd1bb1d457b0a943640fd75b6c2`) and `delayed_delivery_digest_7d` (`HX4410ca3f94e43b70cc1d6761ddda7134`), each receiving one compact aggregate variable.
- Persist per-order/per-alert/per-recipient delivery state separately from the aggregate Twilio message. A unique idempotency key `(order_id, alert_type, phone_number)` plus an atomic batch claim must prevent concurrent cron invocations from sending already-successful orders twice.
- Record every attempted recipient send as success or failure. Failed rows remain retryable; a later run may retry failed rows without retrying successful rows. A failed recipient must not prevent other recipients or other orders from being attempted.
- Process every qualifying order found in the run with bounded iteration/progress and per-order/per-recipient outcomes. One problematic order must not abort the remaining order set.
- Resolve the three configured recipients once per run, normalize/deduplicate phone numbers, and fan out each qualifying alert to each recipient independently.
- Treat `now` as an injected clock in core selection/decision functions so threshold tests are deterministic. The endpoint uses the current clock.

## Explicit exclusions

- No customer-facing WhatsApp alerts.
- No changes to order lifecycle status semantics, shipment provider behavior, Twilio credentials, or admin authorization policy.
- No hard-coded environment host, recipient list, Twilio SID, or undocumented template parameter shape.
- No production data mutation during development or testing.
- No generic WhatsApp logging refactor beyond the fields and query operations required for REN-244 and compatibility with existing logs.

## Requirements

- `REQ-244-1` (explicit): A protected job evaluates delayed fulfillment orders daily at 23:00 Asia/Kolkata.
- `REQ-244-2` (explicit): A paid unshipped order older than 48 hours produces an `unshipped_48h` alert when it is not cancelled or delivered.
- `REQ-244-3` (explicit): A paid shipped order with a shipment older than 7 days and not delivered produces an `undelivered_7d` alert when it is not cancelled.
- `REQ-244-4` (explicit): Each alert includes the specified order/shipment/product details and an order-specific authenticated admin action URL in the correct Twilio button parameter.
- `REQ-244-5` (explicit): Each alert is sent independently to all three configured recipients.
- `REQ-244-6` (explicit): Successful sends are idempotent per order, alert type, and recipient; failed sends are recorded and safely retryable.
- `REQ-244-7` (explicit): Cancelled and delivered orders never qualify, and the cron endpoint rejects missing or invalid cron secrets.

## Scenarios

- `SCN-244-1`: At the exact 48-hour boundary, a paid pending/processing order with no shipment qualifies; one second before it does not.
- `SCN-244-2`: A paid shipped order at the exact seven-day shipment boundary qualifies; a delivered, cancelled, failed, RTO, or younger shipment does not.
- `SCN-244-3`: A qualifying order appears in the correct aggregate for its alert type with product details, quantity, status, shipment date, AWB/tracking data, tracking URL, and the configured-host `/dashboard/general/orders` action URL.
- `SCN-244-4`: Multiple qualifying orders are aggregated by alert type and fan out to exactly three normalized configured recipients, and a missing/duplicate configured number does not create duplicate sends.
- `SCN-244-5`: Re-running after successful sends creates no new Twilio calls; a failed recipient is logged and retried later while successful recipients remain suppressed.
- `SCN-244-6`: Concurrent or overlapping job executions cannot both claim and send the same order/alert/recipient successfully.
- `SCN-244-7`: Missing, malformed, or incorrect cron authorization returns 401/503 as appropriate and performs no selection or send.
- `SCN-244-8`: A run with multiple qualifying orders attempts every order, reports per-order/per-recipient outcomes, and continues after one order or recipient fails.

## Invariants

- `INV-244-1`: Eligibility is evaluated against an injected `now` and inclusive thresholds of 48 hours and seven days.
- `INV-244-2`: Cancelled or delivered orders never produce a delayed-order alert.
- `INV-244-3`: A successful idempotency key `(order, alert type, recipient)` can result in at most one external send.
- `INV-244-4`: Each attempted recipient has one auditable terminal send result for that attempt; failures remain distinguishable from success.
- `INV-244-5`: The action URL uses the existing authenticated admin orders route and runtime host configuration; no environment-specific host is hard-coded.
- `INV-244-6`: A partial Twilio failure does not erase or duplicate successful recipient outcomes.
- `INV-244-7`: Processing one qualifying order never suppresses, skips, or aborts another qualifying order except for an explicitly recorded run-level failure.

## Flows

- `FLOW-244-1`: cron authorization -> candidate query -> per-order classification -> per-order payload rendering -> per-recipient claim -> Twilio send -> success/failure log -> full multi-order run summary.
- `FLOW-244-2`: existing WhatsApp log schema/query compatibility -> migration/backfill-safe new alert identity fields -> unique claim -> retry of failed attempts.

## Dependencies and integrations

- `DEP-244-1`: Existing orders, order items/products/variants, and order shipments are authoritative for alert data.
- `DEP-244-2`: Existing WhatsApp recipient configuration and role/fallback resolution.
- `DEP-244-3`: Existing cron-secret middleware and scheduler configuration.
- `INT-244-1`: Twilio WhatsApp content template sender.
- `INT-244-2`: PostgreSQL/Drizzle persistence for idempotency and audit.

## Security boundaries

- `SEC-244-1`: Only requests with the existing cron secret may invoke the scheduled send path.
- `SEC-244-2`: The admin action link may point only to the existing authenticated admin order route and must not grant access or embed credentials.
- `SEC-244-3`: Logs must not include Twilio auth tokens or full sensitive customer data beyond the configured notification fields.

## Decisions

- `DEC-244-1` (`AUTO_DECIDE`, resolved): Map the issue's “paid/ready” wording to `paymentStatus = paid` and existing `pending`/`processing` order states because no `ready` state exists. Basis: schema evidence.
- `DEC-244-2` (`AUTO_DECIDE`, resolved): Use inclusive threshold comparisons and an injected clock. Basis: exact-boundary acceptance criteria and deterministic tests.
- `DEC-244-3` (`HUMAN_CONFIRMATION`, unresolved): Exact Twilio template SIDs, template names, and button-variable position for delayed-order alerts are not present in repository evidence. Do not invent them. This blocks `READY_FOR_DEV` until confirmed or supplied through repository configuration.
- `DEC-244-4` (`HUMAN_CONFIRMATION`, unresolved): Confirm whether an admin action link should use `/dashboard/general/orders/<id>` or the actual existing detail route after route inspection. The requirement is authenticated admin access; implementation must not guess a non-existent path.

## Required test evidence

- `TEXP-244-1` unit: exact threshold timing, status exclusions, missing shipment date, and product/shipment payload formatting.
- `TEXP-244-2` API/integration: three-recipient fan-out, normalization/deduplication, success suppression, failed-send retry, and concurrent claim behavior.
- `TEXP-244-3` regression: existing WhatsApp shipment notification behavior remains compatible with new log fields.
- `TEXP-244-4` security: cron-secret authorization and no sends on denial.
- `TEXP-244-5` integration: verified Twilio template name/parameter count/button position and order-specific admin URL for both alert types.
- `TEXP-244-6` scheduler: 23:00 Asia/Kolkata schedule configuration.
