CREATE TABLE IF NOT EXISTS "order_shipment_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shipment_id" uuid NOT NULL,
	"order_item_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "order_shipment_items_id_unique" UNIQUE("id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "order_shipments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" text NOT NULL,
	"brand_id" uuid NOT NULL,
	"shiprocket_order_id" integer,
	"shiprocket_shipment_id" integer,
	"courier_company_id" integer,
	"courier_name" text,
	"awb_number" text,
	"tracking_number" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"shipment_date" timestamp,
	"estimated_delivery_date" timestamp,
	"label_url" text,
	"manifest_url" text,
	"invoice_url" text,
	"is_pickup_scheduled" boolean DEFAULT false,
	"pickup_scheduled_date" timestamp,
	"pickup_token_number" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "order_shipments_id_unique" UNIQUE("id")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "order_shipment_items" ADD CONSTRAINT "order_shipment_items_shipment_id_order_shipments_id_fk" FOREIGN KEY ("shipment_id") REFERENCES "public"."order_shipments"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "order_shipment_items" ADD CONSTRAINT "order_shipment_items_order_item_id_orders_id_fk" FOREIGN KEY ("order_item_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "order_shipments" ADD CONSTRAINT "order_shipments_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "order_shipments" ADD CONSTRAINT "order_shipments_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "shipment_item_shipment_id_idx" ON "order_shipment_items" USING btree ("shipment_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "shipment_item_order_item_id_idx" ON "order_shipment_items" USING btree ("order_item_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "order_shipment_order_id_idx" ON "order_shipments" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "order_shipment_brand_id_idx" ON "order_shipments" USING btree ("brand_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "order_shipment_status_idx" ON "order_shipments" USING btree ("status");