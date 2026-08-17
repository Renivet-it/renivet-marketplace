ALTER TABLE "corporate_orders"
    ALTER COLUMN "user_id" DROP NOT NULL;

ALTER TABLE "corporate_orders"
    DROP CONSTRAINT IF EXISTS "corporate_orders_user_id_users_id_fk";

ALTER TABLE "corporate_orders"
    ADD CONSTRAINT "corporate_orders_user_id_users_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "public"."users"("id")
    ON DELETE SET NULL ON UPDATE NO ACTION;

CREATE TABLE IF NOT EXISTS "corporate_payment_requests" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "order_id" uuid NOT NULL,
    "recipient_email" text NOT NULL,
    "token_hash" text NOT NULL,
    "amount_paise" integer NOT NULL,
    "payment_type" text NOT NULL,
    "status" text DEFAULT 'pending' NOT NULL,
    "razorpay_order_id" text,
    "razorpay_payment_id" text,
    "payment_reference" text,
    "payment_mode" text,
    "proof_file_url" text,
    "notes" text,
    "expires_at" timestamp with time zone NOT NULL,
    "sent_at" timestamp with time zone,
    "paid_at" timestamp with time zone,
    "created_by_user_id" text,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL,
    CONSTRAINT "corporate_payment_requests_order_id_corporate_orders_id_fk"
        FOREIGN KEY ("order_id") REFERENCES "public"."corporate_orders"("id")
        ON DELETE CASCADE ON UPDATE NO ACTION,
    CONSTRAINT "corporate_payment_requests_created_by_user_id_users_id_fk"
        FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id")
        ON DELETE SET NULL ON UPDATE NO ACTION
);

CREATE INDEX IF NOT EXISTS "corporate_payment_requests_order_idx"
    ON "corporate_payment_requests" ("order_id");
CREATE INDEX IF NOT EXISTS "corporate_payment_requests_recipient_idx"
    ON "corporate_payment_requests" ("recipient_email");
CREATE INDEX IF NOT EXISTS "corporate_payment_requests_status_idx"
    ON "corporate_payment_requests" ("status");
CREATE UNIQUE INDEX IF NOT EXISTS "corporate_payment_requests_razorpay_payment_unique"
    ON "corporate_payment_requests" ("razorpay_payment_id");
CREATE UNIQUE INDEX IF NOT EXISTS "corporate_payment_requests_token_unique"
    ON "corporate_payment_requests" ("token_hash");
