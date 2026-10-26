CREATE TABLE IF NOT EXISTS "rewear_pickup_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"full_name" text NOT NULL,
	"mobile_number" text NOT NULL,
	"locality" text NOT NULL,
	"garment_count" text NOT NULL,
	"contact_method" text NOT NULL,
	"category_note" text,
	"consent" boolean NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "rewear_pickup_requests_id_unique" UNIQUE("id")
);
