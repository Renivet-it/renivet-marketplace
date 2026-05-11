CREATE TABLE IF NOT EXISTS "whatsapp_message_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"full_name" text NOT NULL,
	"phone_number" text NOT NULL,
	"template_key" text NOT NULL,
	"template_name" text NOT NULL,
	"status" text NOT NULL,
	"success" boolean DEFAULT false NOT NULL,
	"sid" text,
	"error" text,
	"attempts" integer DEFAULT 1 NOT NULL,
	"sent_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "whatsapp_message_logs_id_unique" UNIQUE("id")
);
