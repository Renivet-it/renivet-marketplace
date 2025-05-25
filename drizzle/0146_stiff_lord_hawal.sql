CREATE TABLE IF NOT EXISTS "order_exchange_shipments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"delivered_order_id" text NOT NULL,
	"returned_order_id" uuid NOT NULL,
	"exchange_order_id" text NOT NULL,
	"sr_order_id" bigint,
	"sr_shipment_id" bigint,
	"status" text,
	"awb" bigint,
	"company_courier_name" text,
	"sr_response_json" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "order_exchange_shipments_id_unique" UNIQUE("id"),
	CONSTRAINT "order_exchange_shipments_exchange_order_id_unique" UNIQUE("exchange_order_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "order_return_shipments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"delivered_order_id" text NOT NULL,
	"return_order_id" text NOT NULL,
	"sr_order_id" bigint,
	"sr_shipment_id" bigint,
	"status" text,
	"rto_exchange_type" boolean DEFAULT false,
	"awb" bigint,
	"company_name_courier" text,
	"sr_response_json" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "order_return_shipments_id_unique" UNIQUE("id"),
	CONSTRAINT "order_return_shipments_return_order_id_unique" UNIQUE("return_order_id")
);
--> statement-breakpoint
ALTER TABLE "order_shipments" ADD COLUMN "is_rto_return" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "order_shipments" ADD CONSTRAINT "order_id_unique_idx" UNIQUE("order_id");
DO $$ BEGIN
 ALTER TABLE "order_exchange_shipments" ADD CONSTRAINT "delivered_order_id_fk" FOREIGN KEY ("delivered_order_id") REFERENCES "public"."order_shipments"("order_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "order_exchange_shipments" ADD CONSTRAINT "return_order_id_fk" FOREIGN KEY ("returned_order_id") REFERENCES "public"."order_return_shipments"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "order_return_shipments" ADD CONSTRAINT "delivered_order_id_fk" FOREIGN KEY ("delivered_order_id") REFERENCES "public"."order_shipments"("order_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "es_doi_idx" ON "order_exchange_shipments" USING btree ("delivered_order_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "es_roi_idx" ON "order_exchange_shipments" USING btree ("returned_order_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "rs_doi_idx" ON "order_return_shipments" USING btree ("delivered_order_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "rs_roi_idx" ON "order_return_shipments" USING btree ("return_order_id");--> statement-breakpoint