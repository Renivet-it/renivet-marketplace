CREATE TABLE IF NOT EXISTS "payment_event_receipts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider" text DEFAULT 'razorpay' NOT NULL,
	"event_type" text NOT NULL,
	"provider_payment_id" text NOT NULL,
	"provider_order_id" text NOT NULL,
	"order_id" text NOT NULL,
	"order_intent_id" text,
	"amount_paise" integer NOT NULL,
	"currency" text NOT NULL,
	"status" text DEFAULT 'received' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"applied_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "payment_event_receipts" ADD CONSTRAINT "payment_event_receipts_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DROP INDEX IF EXISTS "payment_event_receipts_identity_idx";
CREATE UNIQUE INDEX "payment_event_receipts_identity_idx" ON "payment_event_receipts" USING btree ("provider","event_type","provider_payment_id","order_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "payment_event_receipts_order_id_idx" ON "payment_event_receipts" USING btree ("order_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "payment_event_receipts_provider_order_id_idx" ON "payment_event_receipts" USING btree ("provider_order_id");
