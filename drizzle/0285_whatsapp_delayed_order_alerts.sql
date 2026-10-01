CREATE TABLE IF NOT EXISTS "whatsapp_delayed_order_alerts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" text NOT NULL,
	"alert_type" text NOT NULL,
	"phone_number" text NOT NULL,
	"digest_line" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"batch_id" text,
	"attempts" integer DEFAULT 0 NOT NULL,
	"sid" text,
	"error" text,
	"last_attempt_at" timestamp,
	"sent_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "whatsapp_delayed_order_alerts_order_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade
);
CREATE UNIQUE INDEX IF NOT EXISTS "whatsapp_delayed_order_alert_identity_idx" ON "whatsapp_delayed_order_alerts" USING btree ("order_id", "alert_type", "phone_number");
CREATE INDEX IF NOT EXISTS "whatsapp_delayed_order_alert_batch_idx" ON "whatsapp_delayed_order_alerts" USING btree ("batch_id");
CREATE INDEX IF NOT EXISTS "whatsapp_delayed_order_alert_status_idx" ON "whatsapp_delayed_order_alerts" USING btree ("status", "alert_type");
