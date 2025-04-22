CREATE TABLE IF NOT EXISTS "home_shop_by_new_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"image_url" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "home_shop_by_new_categories_id_unique" UNIQUE("id")
);
--> statement-breakpoint
-- DROP INDEX IF EXISTS "product_fts_idx";--> statement-breakpoint
-- CREATE INDEX IF NOT EXISTS "product_embedding_idx" ON "products" USING ivfflat ("embeddings" vector_cosine_ops);