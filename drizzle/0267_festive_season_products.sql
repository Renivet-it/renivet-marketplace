ALTER TABLE "products"
ADD COLUMN IF NOT EXISTS "is_festive_season" boolean DEFAULT false NOT NULL;

CREATE TABLE IF NOT EXISTS "festive_season_products" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "product_id" uuid NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
    "position" integer DEFAULT 0 NOT NULL,
    "is_deleted" boolean DEFAULT false NOT NULL,
    "deleted_at" timestamp,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "festive_season_products_product_id_idx"
ON "festive_season_products" ("product_id");
