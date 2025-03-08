CREATE TABLE IF NOT EXISTS "home_shop_by_category_title" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "home_shop_by_category_title_id_unique" UNIQUE("id")
);
