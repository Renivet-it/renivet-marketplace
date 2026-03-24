CREATE TABLE IF NOT EXISTS "brand_subcategory_decodex_journeys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand_id" uuid NOT NULL,
	"subcategory_id" uuid NOT NULL,
	"main_material" text,
	"raw_material_supplier_name" text,
	"raw_material_supplier_location" text,
	"manufacturer_name" text,
	"manufacturing_location" text,
	"packing_dispatch_source" text,
	"packing_dispatch_location" text,
	"virgin_plastic_used" boolean,
	"supplier_declaration_available" boolean,
	"certifications" text,
	"certification_shareable" boolean,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "brand_subcategory_decodex_journeys_id_unique" UNIQUE("id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "brand_subcategory_decodex_stories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand_id" uuid NOT NULL,
	"subcategory_id" uuid NOT NULL,
	"story_human" text,
	"story_truth" text,
	"story_impact" text,
	"story_why" text,
	"story_price_breakdown" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "brand_subcategory_decodex_stories_id_unique" UNIQUE("id")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "brand_subcategory_decodex_journeys" ADD CONSTRAINT "brand_subcategory_decodex_journeys_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "brand_subcategory_decodex_journeys" ADD CONSTRAINT "brand_subcategory_decodex_journeys_subcategory_id_sub_categories_id_fk" FOREIGN KEY ("subcategory_id") REFERENCES "public"."sub_categories"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "brand_subcategory_decodex_stories" ADD CONSTRAINT "brand_subcategory_decodex_stories_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "brand_subcategory_decodex_stories" ADD CONSTRAINT "brand_subcategory_decodex_stories_subcategory_id_sub_categories_id_fk" FOREIGN KEY ("subcategory_id") REFERENCES "public"."sub_categories"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "decodex_journey_brand_idx" ON "brand_subcategory_decodex_journeys" USING btree ("brand_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "decodex_journey_subcategory_idx" ON "brand_subcategory_decodex_journeys" USING btree ("subcategory_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "decodex_journey_brand_subcategory_uq" ON "brand_subcategory_decodex_journeys" USING btree ("brand_id","subcategory_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "decodex_story_brand_idx" ON "brand_subcategory_decodex_stories" USING btree ("brand_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "decodex_story_subcategory_idx" ON "brand_subcategory_decodex_stories" USING btree ("subcategory_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "decodex_story_brand_subcategory_uq" ON "brand_subcategory_decodex_stories" USING btree ("brand_id","subcategory_id");