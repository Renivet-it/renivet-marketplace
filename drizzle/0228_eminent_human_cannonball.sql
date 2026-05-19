CREATE TABLE IF NOT EXISTS "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"recipient_id" text NOT NULL,
	"actor_id" text,
	"audience" text DEFAULT 'user' NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"href" text,
	"read_at" text,
	"metadata" jsonb DEFAULT 'null'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "support_internal_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ticket_id" uuid NOT NULL,
	"author_id" text NOT NULL,
	"note" text NOT NULL,
	"attachments" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_support_attachments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"message_id" uuid NOT NULL,
	"filename" text NOT NULL,
	"url" text NOT NULL,
	"content_type" text,
	"size_bytes" text,
	"file_key" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_support_disputes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ticket_id" uuid NOT NULL,
	"order_id" text NOT NULL,
	"order_item_id" uuid,
	"brand_id" uuid NOT NULL,
	"dispute_type" text DEFAULT 'replacement' NOT NULL,
	"status" text DEFAULT 'pending_admin_review' NOT NULL,
	"admin_decision" text,
	"admin_decision_summary" text,
	"approved_by" text,
	"approved_at" timestamp,
	"action_requested_at" timestamp,
	"action_completed_at" timestamp,
	"replacement_order_id" text,
	"coupon_code" text,
	"metadata" jsonb DEFAULT 'null'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_support_internal_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ticket_id" uuid NOT NULL,
	"author_id" text NOT NULL,
	"note" text NOT NULL,
	"attachments" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "support_assignments" ALTER COLUMN "admin_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "support_ticket_status_history" ALTER COLUMN "changed_by" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "support_attachments" ADD COLUMN "file_key" text;--> statement-breakpoint
ALTER TABLE "support_messages" ADD COLUMN "message_type" text DEFAULT 'message' NOT NULL;--> statement-breakpoint
ALTER TABLE "support_messages" ADD COLUMN "metadata" jsonb DEFAULT 'null'::jsonb;--> statement-breakpoint
ALTER TABLE "support_tickets" ADD COLUMN "issue_label" text;--> statement-breakpoint
ALTER TABLE "support_tickets" ADD COLUMN "assigned_admin_id" text;--> statement-breakpoint
ALTER TABLE "support_tickets" ADD COLUMN "latest_message_at" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "support_tickets" ADD COLUMN "last_opened_at" timestamp;--> statement-breakpoint
ALTER TABLE "support_tickets" ADD COLUMN "status_changed_at" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "support_tickets" ADD COLUMN "resolution_type" text;--> statement-breakpoint
ALTER TABLE "support_tickets" ADD COLUMN "resolution_summary" text;--> statement-breakpoint
ALTER TABLE "support_tickets" ADD COLUMN "resolved_at" timestamp;--> statement-breakpoint
ALTER TABLE "support_tickets" ADD COLUMN "closed_at" timestamp;--> statement-breakpoint
ALTER TABLE "support_tickets" ADD COLUMN "tags" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "user_support_messages" ADD COLUMN "message_type" text DEFAULT 'message' NOT NULL;--> statement-breakpoint
ALTER TABLE "user_support_messages" ADD COLUMN "metadata" jsonb DEFAULT 'null'::jsonb;--> statement-breakpoint
ALTER TABLE "user_support_tickets" ADD COLUMN "order_item_id" uuid;--> statement-breakpoint
ALTER TABLE "user_support_tickets" ADD COLUMN "brand_id" uuid;--> statement-breakpoint
ALTER TABLE "user_support_tickets" ADD COLUMN "issue_label" text;--> statement-breakpoint
ALTER TABLE "user_support_tickets" ADD COLUMN "assigned_admin_id" text;--> statement-breakpoint
ALTER TABLE "user_support_tickets" ADD COLUMN "latest_message_at" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "user_support_tickets" ADD COLUMN "last_opened_at" timestamp;--> statement-breakpoint
ALTER TABLE "user_support_tickets" ADD COLUMN "status_changed_at" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "user_support_tickets" ADD COLUMN "resolution_type" text;--> statement-breakpoint
ALTER TABLE "user_support_tickets" ADD COLUMN "resolution_summary" text;--> statement-breakpoint
ALTER TABLE "user_support_tickets" ADD COLUMN "resolved_at" timestamp;--> statement-breakpoint
ALTER TABLE "user_support_tickets" ADD COLUMN "closed_at" timestamp;--> statement-breakpoint
ALTER TABLE "user_support_tickets" ADD COLUMN "tags" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "user_support_tickets" ADD COLUMN "intake_context" jsonb DEFAULT 'null'::jsonb;--> statement-breakpoint
ALTER TABLE "user_support_tickets" ADD COLUMN "brand_action_required" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "user_support_tickets" ADD COLUMN "brand_action_status" text DEFAULT 'not_required';--> statement-breakpoint
ALTER TABLE "user_support_tickets" ADD COLUMN "linked_replacement_order_id" text;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "support_internal_notes" ADD CONSTRAINT "support_internal_notes_ticket_id_support_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."support_tickets"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_support_attachments" ADD CONSTRAINT "user_support_attachments_message_id_user_support_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."user_support_messages"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_support_disputes" ADD CONSTRAINT "user_support_disputes_ticket_id_user_support_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."user_support_tickets"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_support_internal_notes" ADD CONSTRAINT "user_support_internal_notes_ticket_id_user_support_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."user_support_tickets"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
