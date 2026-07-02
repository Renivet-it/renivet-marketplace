CREATE TABLE IF NOT EXISTS "user_swap_rewards" (
	"user_id" text PRIMARY KEY NOT NULL,
	"total_stamp_count" integer DEFAULT 0 NOT NULL,
	"current_cycle_stamp_count" integer DEFAULT 0 NOT NULL,
	"reward_status" text DEFAULT 'locked' NOT NULL,
	"unlocked_at" text,
	"redeemed_at" text,
	"total_rewards_earned" integer DEFAULT 0 NOT NULL,
	"active_reward_cycle" integer DEFAULT 1 NOT NULL,
	"last_stamp_order_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_swap_rewards" ADD CONSTRAINT "user_swap_rewards_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_swap_rewards_status_idx" ON "user_swap_rewards" USING btree ("reward_status");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "swap_reward_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"order_id" text,
	"reward_cycle" integer DEFAULT 1 NOT NULL,
	"type" text NOT NULL,
	"stamp_delta" integer DEFAULT 0 NOT NULL,
	"metadata" jsonb DEFAULT 'null'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "swap_reward_events" ADD CONSTRAINT "swap_reward_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "swap_reward_events" ADD CONSTRAINT "swap_reward_events_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "swap_reward_events_user_id_idx" ON "swap_reward_events" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "swap_reward_events_order_id_idx" ON "swap_reward_events" USING btree ("order_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "swap_reward_events_user_cycle_idx" ON "swap_reward_events" USING btree ("user_id","reward_cycle");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "reward_redemptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"order_id" text,
	"product_id" uuid NOT NULL,
	"variant_id" uuid,
	"reward_cycle" integer NOT NULL,
	"reward_value" integer NOT NULL,
	"status" text DEFAULT 'initiated' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "reward_redemptions" ADD CONSTRAINT "reward_redemptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "reward_redemptions" ADD CONSTRAINT "reward_redemptions_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "reward_redemptions" ADD CONSTRAINT "reward_redemptions_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "reward_redemptions_order_idx" ON "reward_redemptions" USING btree ("order_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "reward_redemptions_user_idx" ON "reward_redemptions" USING btree ("user_id");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "reward_redemptions_user_cycle_unique" ON "reward_redemptions" USING btree ("user_id","reward_cycle");
--> statement-breakpoint

ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "is_swap_reward_order" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "swap_reward_cycle" integer;
--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "reward_redemption_id" uuid;
