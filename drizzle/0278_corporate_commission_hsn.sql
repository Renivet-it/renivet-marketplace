ALTER TABLE "corporate_quotes"
ADD COLUMN "commission_hsn_code" text;
--> statement-breakpoint

ALTER TABLE "corporate_orders"
ADD COLUMN "commission_hsn_code" text;
