CREATE TABLE IF NOT EXISTS "brand_subscriptions" (
	"id" text PRIMARY KEY NOT NULL,
	"plan_id" text NOT NULL,
	"brand_id" uuid NOT NULL,
	"total_count" integer DEFAULT 1 NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"start_at" timestamp NOT NULL,
	"expire_by" timestamp,
	"customer_notify" boolean DEFAULT true NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "brand_subscriptions_id_unique" UNIQUE("id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "plans" (
	"id" text PRIMARY KEY NOT NULL,
	"interval" integer DEFAULT 1 NOT NULL,
	"period" text DEFAULT 'monthly' NOT NULL,
	"amount" integer NOT NULL,
	"currency" text DEFAULT 'INR' NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "plans_id_unique" UNIQUE("id")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "brand_subscriptions" ADD CONSTRAINT "brand_subscriptions_plan_id_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "brand_subscriptions" ADD CONSTRAINT "brand_subscriptions_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "brand_subscription_is_active_idx" ON "brand_subscriptions" USING btree ("is_active");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "brand_subscription_brand_id_is_active_idx" ON "brand_subscriptions" USING btree ("brand_id","is_active");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "brand_subscription_plan_id_is_active_idx" ON "brand_subscriptions" USING btree ("plan_id","is_active");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "plan_is_active_idx" ON "plans" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "plan_id_is_active_idx" ON "plans" USING btree ("id","is_active");