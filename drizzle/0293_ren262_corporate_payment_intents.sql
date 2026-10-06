CREATE TABLE IF NOT EXISTS "corporate_payment_intents" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "order_id" uuid,
  "payment_request_id" uuid,
  "user_id" text NOT NULL,
  "payment_kind" text NOT NULL,
  "amount_paise" integer NOT NULL,
  "currency" text DEFAULT 'INR' NOT NULL,
  "provider_order_id" text,
  "provider_payment_id" text,
  "status" text DEFAULT 'created' NOT NULL,
  "order_snapshot" jsonb NOT NULL,
  "rejection_code" text,
  "recovery_metadata" jsonb,
  "expires_at" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "corporate_payment_intents_order_id_fk" FOREIGN KEY ("order_id") REFERENCES "corporate_orders"("id") ON DELETE SET NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "corporate_payment_refunds" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "intent_id" uuid NOT NULL,
  "provider_payment_id" text NOT NULL,
  "amount_paise" integer NOT NULL,
  "status" text DEFAULT 'pending' NOT NULL,
  "provider_refund_id" text,
  "failure_reason" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "corporate_payment_refunds_intent_id_fk" FOREIGN KEY ("intent_id") REFERENCES "corporate_payment_intents"("id") ON DELETE CASCADE
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "corporate_payment_intents_provider_order_unique" ON "corporate_payment_intents" USING btree ("provider_order_id");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "corporate_payment_intents_provider_payment_unique" ON "corporate_payment_intents" USING btree ("provider_payment_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "corporate_payment_intents_order_idx" ON "corporate_payment_intents" USING btree ("order_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "corporate_payment_intents_recovery_idx" ON "corporate_payment_intents" USING btree ("status", "created_at");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "corporate_payment_refunds_intent_unique" ON "corporate_payment_refunds" USING btree ("intent_id");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "corporate_payment_refunds_provider_refund_unique" ON "corporate_payment_refunds" USING btree ("provider_refund_id");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "corporate_payments_payment_reference_unique" ON "corporate_payments" USING btree ("payment_reference") WHERE "payment_mode" = 'razorpay' AND "payment_reference" IS NOT NULL;
