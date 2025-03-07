ALTER TABLE "legals" ADD COLUMN "shipping_policy" text;--> statement-breakpoint
ALTER TABLE "legals" ADD COLUMN "refund_policy" text;--> statement-breakpoint
ALTER TABLE "legals" ADD COLUMN "sp_created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "legals" ADD COLUMN "rp_created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "legals" ADD COLUMN "sp_updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "legals" ADD COLUMN "rp_updated_at" timestamp DEFAULT now() NOT NULL;