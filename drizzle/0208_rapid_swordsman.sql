CREATE TABLE IF NOT EXISTS "brand_aliases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand_id" uuid NOT NULL,
	"alias" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "brand_aliases_id_unique" UNIQUE("id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "search_analytics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"original_query" text NOT NULL,
	"normalized_query" text NOT NULL,
	"intent_type" text NOT NULL,
	"matched_brand_id" uuid,
	"matched_category_id" uuid,
	"matched_subcategory_id" uuid,
	"matched_product_type_id" uuid,
	"session_id" text,
	"user_id" text,
	"result_count" text,
	"clicked_product_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "search_analytics_id_unique" UNIQUE("id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "search_intents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"keyword" text NOT NULL,
	"intent_type" text NOT NULL,
	"category_ids" text NOT NULL,
	"priority" text DEFAULT 'medium' NOT NULL,
	"source" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "search_intents_id_unique" UNIQUE("id"),
	CONSTRAINT "search_intents_keyword_unique" UNIQUE("keyword")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "brand_aliases" ADD CONSTRAINT "brand_aliases_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "search_analytics" ADD CONSTRAINT "search_analytics_matched_brand_id_brands_id_fk" FOREIGN KEY ("matched_brand_id") REFERENCES "public"."brands"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "search_analytics" ADD CONSTRAINT "search_analytics_matched_category_id_categories_id_fk" FOREIGN KEY ("matched_category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "search_analytics" ADD CONSTRAINT "search_analytics_matched_subcategory_id_sub_categories_id_fk" FOREIGN KEY ("matched_subcategory_id") REFERENCES "public"."sub_categories"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "search_analytics" ADD CONSTRAINT "search_analytics_matched_product_type_id_product_types_id_fk" FOREIGN KEY ("matched_product_type_id") REFERENCES "public"."product_types"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "brand_alias_idx" ON "brand_aliases" USING btree ("alias");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "brand_alias_brand_id_idx" ON "brand_aliases" USING btree ("brand_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "search_analytics_query_idx" ON "search_analytics" USING btree ("normalized_query");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "search_analytics_intent_idx" ON "search_analytics" USING btree ("intent_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "search_analytics_created_idx" ON "search_analytics" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "search_intent_keyword_idx" ON "search_intents" USING btree ("keyword");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "search_intent_type_idx" ON "search_intents" USING btree ("intent_type");