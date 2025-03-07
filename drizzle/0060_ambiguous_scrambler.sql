CREATE TABLE IF NOT EXISTS "legals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"privacy_policy" text,
	"terms_of_service" text,
	"pp_created_at" timestamp DEFAULT now() NOT NULL,
	"tos_created_at" timestamp DEFAULT now() NOT NULL,
	"pp_updated_at" timestamp DEFAULT now() NOT NULL,
	"tos_updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "legals_id_unique" UNIQUE("id")
);
