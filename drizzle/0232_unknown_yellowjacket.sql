CREATE TABLE IF NOT EXISTS "support_daily_check_ins" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"check_date" date NOT NULL,
	"check_type" text NOT NULL,
	"owner_id" text,
	"open_tickets" integer DEFAULT 0 NOT NULL,
	"aged_tickets_24h" integer DEFAULT 0 NOT NULL,
	"approaching_sla" integer DEFAULT 0 NOT NULL,
	"breached_sla" integer DEFAULT 0 NOT NULL,
	"critical_tickets" integer DEFAULT 0 NOT NULL,
	"summary" text,
	"blockers" text,
	"metadata" jsonb DEFAULT 'null'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "support_monthly_pattern_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"review_month" text NOT NULL,
	"owner_id" text,
	"total_tickets" integer DEFAULT 0 NOT NULL,
	"csat_average" integer,
	"first_touch_resolution_rate" integer,
	"refund_rate" integer,
	"preventable_issue_rate" integer,
	"top_categories" jsonb DEFAULT '[]'::jsonb,
	"top_brands_by_complaint" jsonb DEFAULT '[]'::jsonb,
	"customers_with_multiple_tickets" jsonb DEFAULT '[]'::jsonb,
	"learnings" text,
	"drive_link" text,
	"action_items" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "support_weekly_summaries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"week_start" date NOT NULL,
	"week_end" date NOT NULL,
	"owner_id" text,
	"tickets_opened" integer DEFAULT 0 NOT NULL,
	"tickets_resolved" integer DEFAULT 0 NOT NULL,
	"open_tickets_at_week_end" integer DEFAULT 0 NOT NULL,
	"aged_tickets_48h" integer DEFAULT 0 NOT NULL,
	"sla_breaches" integer DEFAULT 0 NOT NULL,
	"escalated_to_aj" integer DEFAULT 0 NOT NULL,
	"avg_first_response_minutes" integer,
	"sla_hit_rate" integer,
	"csat_average" integer,
	"top_categories" jsonb DEFAULT '[]'::jsonb,
	"top_resolution_codes" jsonb DEFAULT '[]'::jsonb,
	"summary" text,
	"action_items" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "support_tickets" ADD COLUMN "source_channel" text DEFAULT 'admin_manual' NOT NULL;--> statement-breakpoint
ALTER TABLE "support_tickets" ADD COLUMN "first_response_due_at" timestamp;--> statement-breakpoint
ALTER TABLE "support_tickets" ADD COLUMN "first_responded_at" timestamp;--> statement-breakpoint
ALTER TABLE "support_tickets" ADD COLUMN "resolution_due_at" timestamp;--> statement-breakpoint
ALTER TABLE "support_tickets" ADD COLUMN "next_customer_update_due_at" timestamp;--> statement-breakpoint
ALTER TABLE "support_tickets" ADD COLUMN "auto_ack_sent_at" timestamp;--> statement-breakpoint
ALTER TABLE "support_tickets" ADD COLUMN "auto_ack_template_key" text;--> statement-breakpoint
ALTER TABLE "support_tickets" ADD COLUMN "resolution_code" text;--> statement-breakpoint
ALTER TABLE "support_tickets" ADD COLUMN "customer_ping_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "support_tickets" ADD COLUMN "escalated_at" timestamp;--> statement-breakpoint
ALTER TABLE "support_tickets" ADD COLUMN "escalation_owner" text;--> statement-breakpoint
ALTER TABLE "support_tickets" ADD COLUMN "auto_close_eligible_at" timestamp;--> statement-breakpoint
ALTER TABLE "support_tickets" ADD COLUMN "reopen_allowed_until" timestamp;--> statement-breakpoint
ALTER TABLE "support_tickets" ADD COLUMN "csat_score" integer;--> statement-breakpoint
ALTER TABLE "support_tickets" ADD COLUMN "csat_comment" text;--> statement-breakpoint
ALTER TABLE "support_tickets" ADD COLUMN "csat_sent_at" timestamp;--> statement-breakpoint
ALTER TABLE "support_tickets" ADD COLUMN "csat_responded_at" timestamp;--> statement-breakpoint
ALTER TABLE "support_tickets" ADD COLUMN "preventable" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "support_tickets" ADD COLUMN "pattern_tags" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "user_support_tickets" ADD COLUMN "source_channel" text DEFAULT 'web_form' NOT NULL;--> statement-breakpoint
ALTER TABLE "user_support_tickets" ADD COLUMN "first_response_due_at" timestamp;--> statement-breakpoint
ALTER TABLE "user_support_tickets" ADD COLUMN "first_responded_at" timestamp;--> statement-breakpoint
ALTER TABLE "user_support_tickets" ADD COLUMN "resolution_due_at" timestamp;--> statement-breakpoint
ALTER TABLE "user_support_tickets" ADD COLUMN "next_customer_update_due_at" timestamp;--> statement-breakpoint
ALTER TABLE "user_support_tickets" ADD COLUMN "auto_ack_sent_at" timestamp;--> statement-breakpoint
ALTER TABLE "user_support_tickets" ADD COLUMN "auto_ack_template_key" text;--> statement-breakpoint
ALTER TABLE "user_support_tickets" ADD COLUMN "resolution_code" text;--> statement-breakpoint
ALTER TABLE "user_support_tickets" ADD COLUMN "customer_ping_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "user_support_tickets" ADD COLUMN "escalated_at" timestamp;--> statement-breakpoint
ALTER TABLE "user_support_tickets" ADD COLUMN "escalation_owner" text;--> statement-breakpoint
ALTER TABLE "user_support_tickets" ADD COLUMN "auto_close_eligible_at" timestamp;--> statement-breakpoint
ALTER TABLE "user_support_tickets" ADD COLUMN "reopen_allowed_until" timestamp;--> statement-breakpoint
ALTER TABLE "user_support_tickets" ADD COLUMN "csat_score" integer;--> statement-breakpoint
ALTER TABLE "user_support_tickets" ADD COLUMN "csat_comment" text;--> statement-breakpoint
ALTER TABLE "user_support_tickets" ADD COLUMN "csat_sent_at" timestamp;--> statement-breakpoint
ALTER TABLE "user_support_tickets" ADD COLUMN "csat_responded_at" timestamp;--> statement-breakpoint
ALTER TABLE "user_support_tickets" ADD COLUMN "preventable" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "user_support_tickets" ADD COLUMN "pattern_tags" jsonb DEFAULT '[]'::jsonb;