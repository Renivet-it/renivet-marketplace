CREATE TABLE IF NOT EXISTS "capi_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_name" text NOT NULL,
	"event_id" text NOT NULL,
	"user_data" jsonb,
	"custom_data" jsonb,
	"status" text NOT NULL,
	"response" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "capi_logs_id_unique" UNIQUE("id")
);
