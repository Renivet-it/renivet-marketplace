ALTER TABLE "brand_confidentials" ADD COLUMN "is_same_as_warehouse_address" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "brand_confidentials" ADD COLUMN "warehouse_address_line1" text;--> statement-breakpoint
ALTER TABLE "brand_confidentials" ADD COLUMN "warehouse_address_line2" text;--> statement-breakpoint
ALTER TABLE "brand_confidentials" ADD COLUMN "warehouse_city" text;--> statement-breakpoint
ALTER TABLE "brand_confidentials" ADD COLUMN "warehouse_state" text;--> statement-breakpoint
ALTER TABLE "brand_confidentials" ADD COLUMN "warehouse_postal_code" text;--> statement-breakpoint
ALTER TABLE "brand_confidentials" ADD COLUMN "warehouse_country" text;