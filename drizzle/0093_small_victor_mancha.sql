CREATE TABLE IF NOT EXISTS "brand_media_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand_id" uuid NOT NULL,
	"product_id" uuid,
	"is_used_in_product" boolean DEFAULT false NOT NULL,
	"media_url" text NOT NULL,
	"media_type" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "brand_media_items_id_unique" UNIQUE("id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "product_options" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"name" text NOT NULL,
	"values" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "product_options_id_unique" UNIQUE("id")
);
--> statement-breakpoint
ALTER TABLE "carts" DROP CONSTRAINT "carts_sku_product_variants_sku_fk";
--> statement-breakpoint
ALTER TABLE "order_items" DROP CONSTRAINT "order_items_sku_product_variants_sku_fk";
--> statement-breakpoint
DROP INDEX IF EXISTS "product_variant_product_id_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "product_variant_color_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "product_variant_size_color_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "product_status_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "product_fts_idx";--> statement-breakpoint
/* 
    Unfortunately in current drizzle-kit version we can't automatically get name for primary key.
    We are working on making it available!

    Meanwhile you can:
        1. Check pk name in your database, by running
            SELECT constraint_name FROM information_schema.table_constraints
            WHERE table_schema = 'public'
                AND table_name = 'product_variants'
                AND constraint_type = 'PRIMARY KEY';
        2. Uncomment code below and paste pk name manually
        
    Hope to release this update as soon as possible
*/

ALTER TABLE "product_variants" DROP CONSTRAINT "product_variants_sku_unique";--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "description" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "price" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "weight" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "weight" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "length" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "length" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "width" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "width" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "height" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "height" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "sustainability_certificate_url" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "product_variants" ADD COLUMN "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL;--> statement-breakpoint
ALTER TABLE "product_variants" ADD COLUMN "price" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "product_variants" ADD COLUMN "compare_at_price" integer;--> statement-breakpoint
ALTER TABLE "product_variants" ADD COLUMN "cost_per_item" integer;--> statement-breakpoint
ALTER TABLE "product_variants" ADD COLUMN "barcode" text;--> statement-breakpoint
ALTER TABLE "product_variants" ADD COLUMN "weight" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "product_variants" ADD COLUMN "length" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "product_variants" ADD COLUMN "width" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "product_variants" ADD COLUMN "height" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "product_variants" ADD COLUMN "origin_country" text;--> statement-breakpoint
ALTER TABLE "product_variants" ADD COLUMN "hs_code" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "title" text NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "published_at" timestamp;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "media" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "product_has_variants" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "compare_at_price" integer;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "cost_per_item" integer;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "sku" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "barcode" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "quantity" integer;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "origin_country" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "hs_code" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "meta_title" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "meta_description" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "meta_keywords" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "verification_status" text DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "rejected_at" timestamp;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "brand_media_items" ADD CONSTRAINT "brand_media_items_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "brand_media_items" ADD CONSTRAINT "brand_media_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "product_options" ADD CONSTRAINT "product_options_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "brand_media_item_brand_id_idx" ON "brand_media_items" USING btree ("brand_id");--> statement-breakpoint
ALTER TABLE "product_variants" DROP COLUMN IF EXISTS "size";--> statement-breakpoint
ALTER TABLE "product_variants" DROP COLUMN IF EXISTS "color";--> statement-breakpoint
ALTER TABLE "product_variants" DROP COLUMN IF EXISTS "is_available";--> statement-breakpoint
ALTER TABLE "product_variants" DROP COLUMN IF EXISTS "is_deleted";--> statement-breakpoint
ALTER TABLE "product_variants" DROP COLUMN IF EXISTS "created_at";--> statement-breakpoint
ALTER TABLE "product_variants" DROP COLUMN IF EXISTS "updated_at";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN IF EXISTS "name";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN IF EXISTS "base_price";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN IF EXISTS "tax_rate";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN IF EXISTS "image_urls";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN IF EXISTS "is_sent_for_review";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN IF EXISTS "status";--> statement-breakpoint
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_id_unique" UNIQUE("id");