CREATE TABLE IF NOT EXISTS "email_message_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"first_name" text,
	"subject" text NOT NULL,
	"email_content" text NOT NULL,
	"status" text NOT NULL,
	"success" boolean DEFAULT false NOT NULL,
	"message_id" text,
	"error" text,
	"attempts" integer DEFAULT 1 NOT NULL,
	"sent_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "email_message_logs_id_unique" UNIQUE("id")
);
