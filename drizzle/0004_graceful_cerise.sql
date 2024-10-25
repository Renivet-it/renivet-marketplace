CREATE TABLE IF NOT EXISTS "brands_waitlist" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"brand_name" text NOT NULL,
	"brand_email" text NOT NULL,
	"brand_phone" text,
	"brand_website" text,
	CONSTRAINT "brands_waitlist_id_unique" UNIQUE("id"),
	CONSTRAINT "brands_waitlist_brand_email_unique" UNIQUE("brand_email")
);
