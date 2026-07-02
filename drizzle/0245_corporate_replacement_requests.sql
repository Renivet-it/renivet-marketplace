CREATE TABLE "corporate_replacement_requests" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "order_id" uuid NOT NULL,
    "requested_by_user_id" text,
    "reviewed_by_user_id" text,
    "replacement_order_id" uuid,
    "requested_quantity" integer DEFAULT 1 NOT NULL,
    "reason_code" text NOT NULL,
    "reason_details" text,
    "photos" jsonb DEFAULT '[]'::jsonb NOT NULL,
    "status" text DEFAULT 'requested' NOT NULL,
    "admin_note" text,
    "reviewed_at" date,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
);

ALTER TABLE "corporate_replacement_requests"
    ADD CONSTRAINT "corporate_replacement_requests_order_id_corporate_orders_id_fk"
    FOREIGN KEY ("order_id") REFERENCES "public"."corporate_orders"("id")
    ON DELETE cascade ON UPDATE no action;

ALTER TABLE "corporate_replacement_requests"
    ADD CONSTRAINT "corporate_replacement_requests_requested_by_user_id_users_id_fk"
    FOREIGN KEY ("requested_by_user_id") REFERENCES "public"."users"("id")
    ON DELETE set null ON UPDATE no action;

ALTER TABLE "corporate_replacement_requests"
    ADD CONSTRAINT "corporate_replacement_requests_reviewed_by_user_id_users_id_fk"
    FOREIGN KEY ("reviewed_by_user_id") REFERENCES "public"."users"("id")
    ON DELETE set null ON UPDATE no action;

ALTER TABLE "corporate_replacement_requests"
    ADD CONSTRAINT "corporate_replacement_requests_replacement_order_id_corporate_orders_id_fk"
    FOREIGN KEY ("replacement_order_id") REFERENCES "public"."corporate_orders"("id")
    ON DELETE set null ON UPDATE no action;

CREATE INDEX "corporate_replacement_requests_order_idx"
    ON "corporate_replacement_requests" USING btree ("order_id");

CREATE INDEX "corporate_replacement_requests_status_idx"
    ON "corporate_replacement_requests" USING btree ("status");

CREATE INDEX "corporate_replacement_requests_replacement_order_idx"
    ON "corporate_replacement_requests" USING btree ("replacement_order_id");
