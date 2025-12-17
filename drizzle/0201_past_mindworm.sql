CREATE TABLE IF NOT EXISTS "shipment_discrepancies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" text NOT NULL,
	"product_id" uuid NOT NULL,
	"brand_id" uuid NOT NULL,
	"brand_packing_id" uuid,
	"actual_weight" integer NOT NULL,
	"volumetric_weight" integer NOT NULL,
	"length" integer NOT NULL,
	"width" integer NOT NULL,
	"height" integer NOT NULL,
	"reason" text NOT NULL,
	"rules_violated" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "shipment_discrepancies" ADD CONSTRAINT "shipment_discrepancies_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "shipment_discrepancies" ADD CONSTRAINT "shipment_discrepancies_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "shipment_discrepancies" ADD CONSTRAINT "shipment_discrepancies_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "shipment_discrepancies" ADD CONSTRAINT "shipment_discrepancies_brand_packing_id_brand_product_type_packing_id_fk" FOREIGN KEY ("brand_packing_id") REFERENCES "public"."brand_product_type_packing"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
