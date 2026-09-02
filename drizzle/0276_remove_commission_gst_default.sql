ALTER TABLE "corporate_orders"
ALTER COLUMN "commission_gst_rate_bps" DROP DEFAULT;
--> statement-breakpoint

ALTER TABLE "corporate_quotes"
ALTER COLUMN "commission_gst_rate_bps" DROP DEFAULT;
--> statement-breakpoint

ALTER TABLE "corporate_settlement_statements"
ALTER COLUMN "commission_gst_rate_bps" DROP DEFAULT;
