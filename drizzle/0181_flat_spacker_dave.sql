CREATE TABLE IF NOT EXISTS "product_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"brand_id" uuid NOT NULL,
	"user_id" text,
	"event" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "product_events" ADD CONSTRAINT "product_events_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "product_events" ADD CONSTRAINT "product_events_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "product_events_event_idx" ON "product_events" USING btree ("event");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "product_events_product_event_idx" ON "product_events" USING btree ("product_id","event");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "product_events_brand_event_idx" ON "product_events" USING btree ("brand_id","event");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "product_events_created_at_idx" ON "product_events" USING btree ("created_at");