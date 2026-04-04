# Admin Analytics Dashboard Implementation Blueprint

Last updated: April 2, 2026
Project: `renivet-marketplace`

## 1. Purpose
## 1.1 Implementation Status (April 3, 2026)

The following phases are now implemented in code:

- Phase 1: SQL metric correctness layer and corrected time-series aggregation.
- Phase 2: Behavior instrumentation events wired (`product_viewed`, `add_to_cart`, `checkout_started`, `purchase_completed`).
- Phase 3: Analytics backend expanded with behavior endpoints, saved report CRUD, and snapshot refresh pipeline.
- Phase 4: New admin analytics dashboard UI route, KPI + behavior + landing-page blocks, report explorer, and freeform report runner.
- Phase 5: Snapshot refresh cron endpoint and implementation notes for operational reconciliation.

Required deployment configuration for full behavior snapshots:

- `POSTHOG_PROJECT_ID`
- `POSTHOG_PERSONAL_API_KEY`
- optional `ANALYTICS_CRON_SECRET` for protecting cron endpoint

Cron endpoint added:

- `GET /api/cron/analytics-refresh`


This document is a pre-implementation blueprint for building a Shopify-like analytics dashboard in the admin panel, including:

- What you can ship immediately with current data.
- What is possible only after additional tracking.
- What is not realistically possible without major instrumentation.
- Exact implementation approach for your current stack (Next.js + Drizzle + PostgreSQL + Redis + tRPC + Recharts + PostHog).

## 2. Target Experience (based on your references)

You want an admin dashboard with:

- KPI cards (sales, orders, returning customer rate, etc.).
- Time-series chart with comparison period.
- Side breakdown panel (gross sales, discounts, returns, taxes, net).
- Report explorer list (for example: total sales by product, sessions by landing page, sessions by location).
- Freeform report builder:
- Select metrics.
- Select dimensions.
- Switch visualization type.
- Add filters.
- Render table/list/chart output.

## 3. Current State In Your Codebase

### 3.1 Existing analytics/report surfaces

- Global analytics page: `src/app/(protected)/dashboard/general/product-reports-analytics/page.tsx`
- Operational reports page: `src/app/(protected)/dashboard/general/operational-reports/page.tsx`
- Brand analytics page: `src/app/(protected)/dashboard/brands/[bId]/new-analytics/page.tsx`
- Operational CSV export API: `src/app/api/reports/operational/route.ts`

### 3.2 Existing data sources

1. Redis event counters (brand namespace)
- `src/lib/redis/methods/analytics.ts`
- Keys are hash counters per day, namespace, brand.
- Good for simple trend counters.
- Not ideal for session-level analytics or rich dimensions.

2. Redis revenue tracking
- `src/lib/redis/methods/revenue.ts`
- Tracks payments/refunds by day.

3. SQL product events table
- `src/lib/db/schema/product.ts` (`product_events`)
- Columns: `product_id`, `brand_id`, `user_id`, `event`, `created_at`.
- Event enum includes `click`, `view`, `purchase`, `add_to_cart`.

4. SQL order data
- `orders`, `order_items`, `order_shipments`, returns-related tables.

5. PostHog
- Client provider and pageview capture exist:
- `src/components/providers/client.tsx`
- `src/components/globals/posthog/page-view.tsx`
- Environment is present (`NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST` in `env.ts`).

### 3.3 Critical current limitations

1. No session model in SQL analytics tables
- `product_events` does not store `session_id`, `landing_path`, `referrer`, `utm`, `country`, `device`.
- This blocks true "sessions by landing page/location/referrer" from your own DB.

2. Behavioral data is split across 3 systems
- Redis counters.
- SQL `product_events`.
- PostHog events.
- This causes mismatch risk unless one canonical source is defined.

3. Query correctness risks in existing analytics queries
- `src/lib/db/queries/product.ts` uses `orders.totalAmount` repeatedly in item-level joins. This can inflate per-product sales when an order has multiple items.
- `totalCustomers` is count of orders, not distinct customers in `getOverviewMetrics`.
- Some metrics include cancelled orders unless explicitly filtered.
- `src/lib/trpc/routes/brands/analytics.ts` checks `o.status = 'RETURNED'`, but `orders.status` enum in `src/lib/db/schema/order.ts` is lowercase and does not include `returned`.

4. Product "view" event appears in enum, but event capture is mostly click/cart/purchase in your SQL product-event path
- `track-product.ts` writes click/add_to_cart/purchase.
- This affects view-based conversion reporting quality.

## 4. Can / Cannot Matrix

### 4.1 Can do now (using current data with query fixes)

- Total sales over time.
- Total sales breakdown (gross, discounts, taxes, shipping, net) from order fields.
- Orders over time.
- Top products by sales.
- Top brands by sales.
- Product conversion funnel based on available product events (quality depends on instrumentation coverage).
- Brand-level KPI cards.
- CSV export reports (pattern already exists in operational reports).

### 4.2 Can do with moderate additions (recommended short term)

- New vs returning customers over time (from orders grouped by user first purchase date).
- Checkout conversion rate (if checkout-started event is consistently captured).
- Landing-page performance from PostHog data (without rebuilding session engine immediately).
- Referrer/source performance from PostHog.
- Saved custom report definitions (store user-selected metric/dimension/filter config).

### 4.3 Cannot do accurately yet from current SQL model alone

- True "Sessions by landing page" from your own DB.
- "Sessions by location" from your own DB.
- "Bounce rate over time" from your own DB.
- "Visitors right now" realtime without a stream/realtime analytics backend.

Reason: no reliable session entity and no pageview-level metadata in SQL analytics events.

## 5. Recommended Architecture

## 5.1 Recommendation

Use a hybrid architecture:

- Financial/order truth: PostgreSQL (`orders`, `order_items`, `order_shipments`, return tables).
- Behavioral/session truth: PostHog (already integrated).

Why this is best for your current repo:

- Fastest path to Shopify-like reports.
- Lowest implementation risk.
- Avoids building your own sessionization engine from scratch in Phase 1.

## 5.2 Alternative (not recommended for phase 1)

Build full first-party analytics warehouse in PostgreSQL with custom session tracking.

- Pro: full ownership.
- Con: significant scope (SDK, ingestion, sessionization, bot filtering, realtime infra).

## 6. Data Model Strategy

## 6.1 Canonical metric domains

Domain A: Commerce metrics (SQL)
- Gross sales
- Discounts
- Returns
- Shipping
- Taxes
- Net sales
- Orders
- AOV

Domain B: Behavior metrics (PostHog)
- Sessions
- Visitors
- Landing page path/type
- Referrer/source/UTM
- Bounce rate
- Cart sessions
- Checkout reached sessions

## 6.2 Suggested internal reporting tables (for fast dashboard reads)

You can materialize daily aggregates into SQL for speed and consistent admin queries:

1. `analytics_daily_commerce`
- `date`, `timezone`, `currency`
- `gross_sales_paise`, `discount_paise`, `returns_paise`, `shipping_paise`, `tax_paise`, `net_sales_paise`
- `orders_count`, `customers_count`, `new_customers_count`, `returning_customers_count`

2. `analytics_daily_behavior`
- `date`, `timezone`
- `sessions`, `visitors`, `sessions_with_cart`, `sessions_reached_checkout`, `bounce_sessions`

3. `analytics_landing_page_daily`
- `date`, `landing_path`, `landing_type`, `sessions`, `visitors`, `sessions_with_cart`, `sessions_reached_checkout`

4. `analytics_saved_reports`
- `id`, `name`, `category`, `created_by`
- `metrics[]`, `dimensions[]`, `filters_json`, `visualization_type`
- `is_system_report`, `is_active`

## 7. Metric Definitions (must be frozen before coding)

Use a strict metric contract to avoid future "number mismatch" bugs:

- `gross_sales` = sum(order item line amount before discount and returns)
- `discounts` = sum(order discount amount)
- `returns` = sum(returned/refunded amount tied to completed return/refund states)
- `net_sales` = `gross_sales - discounts - returns`
- `total_sales` = `net_sales + shipping + taxes` (or your chosen business definition; freeze one)
- `sessions` = PostHog sessions with at least one event in range
- `sessions_with_cart` = sessions with `add_to_cart`
- `sessions_reached_checkout` = sessions with checkout_started
- `checkout_conversion_rate` = `sessions_reached_checkout / sessions`
- `bounce_rate` = `single_pageview_sessions / sessions`
- `returning_customer_rate` = `customers_with_previous_paid_order / all_customers_in_period`

## 8. API Design (tRPC-first)

Create `src/lib/trpc/routes/general/analytics.ts` with endpoints:

- `getOverview(input)`
- returns KPI cards + comparison deltas.

- `getSalesTimeSeries(input)`
- returns period points and optional comparison series.

- `getSalesBreakdown(input)`
- returns gross/discounts/returns/net/shipping/tax totals.

- `getReportLibrary(input)`
- returns list of saved/system reports for explorer table.

- `runFreeformReport(input)`
- accepts metrics, dimensions, filters, date range, sort, pagination.
- returns rows + totals + metadata for rendering.

- `saveReport(input)` / `updateReport(input)` / `deleteReport(input)`

Input contract baseline:

- `datePreset`: `7d | 30d | 90d | ytd | custom`
- `startDate`, `endDate`
- `comparison`: `none | previous_period | previous_year`
- `timezone`: default `Asia/Kolkata`
- `currency`: default `INR`

## 9. UI/UX Plan (Shopify-like)

Create a new route:

- `src/app/(protected)/dashboard/general/analytics/page.tsx`

Sections:

1. Header controls
- Date range
- Comparison selector
- Currency selector (if needed)
- Refresh

2. KPI card strip
- Gross sales
- Returning customer rate
- Orders fulfilled
- Orders

3. Main chart + side breakdown
- Left: `Total sales over time`
- Right: `Total sales breakdown`

4. Report explorer table
- Name, category, last viewed, created by
- quick-open preset reports

5. Freeform report builder drawer/panel
- Metric picker
- Dimension picker
- Visualization selector
- Filter builder
- Result table/chart output

Visualization support in phase 1:

- Line chart
- Area chart
- Bar chart (horizontal + vertical)
- Pie chart
- Tabular list by dimension

## 10. Instrumentation Additions Required

To support behavioral reports cleanly:

1. Ensure PostHog captures:
- `product_viewed`
- `add_to_cart`
- `checkout_started`
- `purchase_completed`
- include `product_id`, `brand_id`, `category`, `price`, `currency`.

2. Ensure pageview properties include:
- `$current_url`
- landing path
- referrer/source/utm fields where available.

3. Ensure checkout events are emitted in checkout flows:
- `src/app/(protected)/checkout/checkout-content.tsx`
- `src/app/(protected)/mycart/Component/payment-stepper/order-payment-page.tsx`
- align server and client dedup keys where needed.

## 11. Query Corrections Required Before Trusting Current Charts

Fix these first in existing analytics query layer:

1. Per-product sales calculation
- Do not sum full `orders.totalAmount` per joined product row.
- Use line-item value (`variant_price_or_product_price * quantity`) at product granularity.

2. Total customers
- Use distinct `orders.userId` (or business-specific customer identity logic), not raw order count.

3. Status filtering
- Exclude cancelled and failed statuses from sales/revenue by default.
- Fix status enum mismatch (`RETURNED` vs actual lowercase enums).

4. Conversion denominator
- Ensure view events are actually captured if used in formulas, or redefine conversion as click->purchase.

## 12. Security, Permissions, and Governance

- Keep `VIEW_ANALYTICS` as minimum permission.
- Restrict report editing/deleting to elevated roles.
- Log report definition changes (who changed metrics/formulas and when).
- Mask or avoid PII fields in analytics payloads.
- Enforce row-level scope if you expose brand-specific analytics in shared routes.

## 13. Performance Requirements

Target performance:

- Dashboard initial load: <= 2.0s server response for default 30d.
- Freeform report run: <= 3.0s for common dimensions.
- CSV export async for heavy reports if row count is large.

Caching:

- Cache normalized query results by `(date range + filters + dimension + metrics)` key.
- Invalidate on ETL refresh completion.

## 14. Rollout Plan

Phase 0 (2-3 days): Alignment
- Freeze KPI formulas and report definitions.
- Freeze timezone and currency behavior.

Phase 1 (4-6 days): Data correctness
- Fix existing SQL analytics query logic.
- Add tests for metric correctness.

Phase 2 (4-7 days): Behavioral pipeline alignment
- Finalize PostHog event schema and coverage.
- Backfill recent period if needed.

Phase 3 (5-8 days): New analytics backend APIs
- Add tRPC analytics router.
- Add aggregate queries/materialized snapshots.

Phase 4 (6-10 days): Dashboard UI and report explorer
- Build new `/dashboard/general/analytics`.
- Build report list + freeform panel + visualizations.

Phase 5 (3-5 days): QA + reconciliation
- Compare totals with source-of-truth exports.
- Validate edge cases and permission matrix.

Total estimate: roughly 4-6 weeks for a production-grade first release.

## 15. Testing Checklist

Functional:

- KPI totals match trusted SQL/manual exports.
- Date range filters return expected ranges in `Asia/Kolkata`.
- Comparison period math is correct.
- Freeform reports return deterministic sorted output.

Data quality:

- No duplicate inflation in product-level sales.
- Cancelled orders excluded where required.
- Behavior metrics reconcile with PostHog dashboards.

Access control:

- Unauthorized users cannot access analytics endpoints or pages.

Performance:

- P95 latency within target for default and common filters.

## 16. Explicit "What You Can Do / Cannot Do" Summary

You can do now:

- Build strong commerce analytics dashboard similar in layout to Shopify.
- Build report explorer with saved reports.
- Build product and order-centric analytics with high confidence after query fixes.

You cannot do accurately yet (without additional session instrumentation):

- True sessions by landing page from your own SQL data.
- True sessions by location/referrer from your own SQL data.
- Reliable bounce rate.
- Reliable checkout conversion based on session progression.

You can still deliver those quickly by using PostHog as behavior source in phase 1.

## 17. Final Recommendation

Start implementation with this order:

1. Fix current metric correctness issues in SQL analytics queries.
2. Define canonical metric formulas and lock them.
3. Use PostHog for session/landing/referrer/bounce metrics.
4. Build a new admin analytics page with:
- KPI strip
- Sales time-series
- Breakdown panel
- Report explorer
- Freeform report builder
5. Add aggregate tables and caching for speed.

This path gives you the Shopify-like experience fastest, with reliable numbers and manageable engineering risk.

