CREATE TABLE IF NOT EXISTS "women_new_collection_discount_section" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"image_url" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "women_new_collection_discount_section_id_unique" UNIQUE("id")
);
