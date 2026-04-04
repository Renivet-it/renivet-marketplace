CREATE TABLE IF NOT EXISTS "analytics_daily_behavior" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"date_key" text NOT NULL,
	"timezone" text DEFAULT 'Asia/Kolkata' NOT NULL,
	"sessions" integer DEFAULT 0 NOT NULL,
	"visitors" integer DEFAULT 0 NOT NULL,
	"sessions_with_cart" integer DEFAULT 0 NOT NULL,
	"sessions_reached_checkout" integer DEFAULT 0 NOT NULL,
	"bounce_sessions" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "analytics_daily_commerce" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"date_key" text NOT NULL,
	"timezone" text DEFAULT 'Asia/Kolkata' NOT NULL,
	"currency" text DEFAULT 'INR' NOT NULL,
	"gross_sales_paise" integer DEFAULT 0 NOT NULL,
	"discounts_paise" integer DEFAULT 0 NOT NULL,
	"returns_paise" integer DEFAULT 0 NOT NULL,
	"net_sales_paise" integer DEFAULT 0 NOT NULL,
	"shipping_paise" integer DEFAULT 0 NOT NULL,
	"taxes_paise" integer DEFAULT 0 NOT NULL,
	"total_sales_paise" integer DEFAULT 0 NOT NULL,
	"orders_count" integer DEFAULT 0 NOT NULL,
	"orders_fulfilled_count" integer DEFAULT 0 NOT NULL,
	"customers_count" integer DEFAULT 0 NOT NULL,
	"new_customers_count" integer DEFAULT 0 NOT NULL,
	"returning_customers_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "analytics_landing_page_daily" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"date_key" text NOT NULL,
	"timezone" text DEFAULT 'Asia/Kolkata' NOT NULL,
	"landing_path" text NOT NULL,
	"landing_type" text DEFAULT 'unknown' NOT NULL,
	"sessions" integer DEFAULT 0 NOT NULL,
	"visitors" integer DEFAULT 0 NOT NULL,
	"sessions_with_cart" integer DEFAULT 0 NOT NULL,
	"sessions_reached_checkout" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "analytics_saved_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"category" text DEFAULT 'Sales' NOT NULL,
	"created_by" text,
	"metrics" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"dimensions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"filters_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"visualization_type" text DEFAULT 'line' NOT NULL,
	"is_system_report" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_viewed_at" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "analytics_saved_reports" ADD CONSTRAINT "analytics_saved_reports_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "analytics_daily_behavior_unique_idx" ON "analytics_daily_behavior" USING btree ("date_key","timezone");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "analytics_daily_behavior_date_idx" ON "analytics_daily_behavior" USING btree ("date_key");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "analytics_daily_commerce_unique_idx" ON "analytics_daily_commerce" USING btree ("date_key","timezone","currency");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "analytics_daily_commerce_date_idx" ON "analytics_daily_commerce" USING btree ("date_key");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "analytics_landing_page_daily_unique_idx" ON "analytics_landing_page_daily" USING btree ("date_key","timezone","landing_path","landing_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "analytics_landing_page_daily_date_idx" ON "analytics_landing_page_daily" USING btree ("date_key");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "analytics_landing_page_daily_path_idx" ON "analytics_landing_page_daily" USING btree ("landing_path");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "analytics_saved_reports_name_idx" ON "analytics_saved_reports" USING btree ("name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "analytics_saved_reports_created_by_idx" ON "analytics_saved_reports" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "analytics_saved_reports_active_idx" ON "analytics_saved_reports" USING btree ("is_active");