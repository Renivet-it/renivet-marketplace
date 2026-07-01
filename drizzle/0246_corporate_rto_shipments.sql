CREATE TABLE "corporate_rto_shipments" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "order_id" uuid NOT NULL,
    "replacement_request_id" uuid NOT NULL,
    "provider" text DEFAULT 'delhivery' NOT NULL,
    "pickup_location_code" text,
    "original_awb_number" text,
    "reverse_awb_number" text,
    "reverse_tracking_number" text,
    "reverse_tracking_url" text,
    "reason_code" text NOT NULL,
    "status" text DEFAULT 'draft' NOT NULL,
    "raw_payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
    "created_by_user_id" text,
    "handled_by_user_id" text,
    "scheduled_pickup_date" date,
    "received_at" date,
    "notes" text,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
);

ALTER TABLE "corporate_rto_shipments"
    ADD CONSTRAINT "corporate_rto_shipments_order_id_corporate_orders_id_fk"
    FOREIGN KEY ("order_id") REFERENCES "public"."corporate_orders"("id")
    ON DELETE cascade ON UPDATE no action;

ALTER TABLE "corporate_rto_shipments"
    ADD CONSTRAINT "corporate_rto_shipments_replacement_request_id_corporate_replacement_requests_id_fk"
    FOREIGN KEY ("replacement_request_id") REFERENCES "public"."corporate_replacement_requests"("id")
    ON DELETE cascade ON UPDATE no action;

ALTER TABLE "corporate_rto_shipments"
    ADD CONSTRAINT "corporate_rto_shipments_created_by_user_id_users_id_fk"
    FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id")
    ON DELETE set null ON UPDATE no action;

ALTER TABLE "corporate_rto_shipments"
    ADD CONSTRAINT "corporate_rto_shipments_handled_by_user_id_users_id_fk"
    FOREIGN KEY ("handled_by_user_id") REFERENCES "public"."users"("id")
    ON DELETE set null ON UPDATE no action;

CREATE INDEX "corporate_rto_shipments_order_idx"
    ON "corporate_rto_shipments" USING btree ("order_id");

CREATE UNIQUE INDEX "corporate_rto_shipments_request_idx"
    ON "corporate_rto_shipments" USING btree ("replacement_request_id");

CREATE INDEX "corporate_rto_shipments_status_idx"
    ON "corporate_rto_shipments" USING btree ("status");

CREATE INDEX "corporate_rto_shipments_reverse_awb_idx"
    ON "corporate_rto_shipments" USING btree ("reverse_awb_number");
