CREATE TABLE IF NOT EXISTS "brand_product_type_packing" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand_id" uuid NOT NULL,
	"product_type_id" uuid NOT NULL,
	"packing_type_id" uuid,
	"is_fragile" boolean DEFAULT false NOT NULL,
	"ships_in_own_box" boolean DEFAULT false NOT NULL,
	"can_override" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "brand_product_type_packing" ADD CONSTRAINT "brand_product_type_packing_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "brand_product_type_packing" ADD CONSTRAINT "brand_product_type_packing_product_type_id_product_types_id_fk" FOREIGN KEY ("product_type_id") REFERENCES "public"."product_types"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "brand_product_type_packing" ADD CONSTRAINT "brand_product_type_packing_packing_type_id_packing_types_id_fk" FOREIGN KEY ("packing_type_id") REFERENCES "public"."packing_types"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "brand_product_type_unique_idx" ON "brand_product_type_packing" USING btree ("brand_id","product_type_id");