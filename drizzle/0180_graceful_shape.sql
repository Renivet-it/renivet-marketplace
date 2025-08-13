CREATE TABLE IF NOT EXISTS "home_event_banner_section_two" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"video_url" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "home_event_banner_section_two_id_unique" UNIQUE("id")
);
