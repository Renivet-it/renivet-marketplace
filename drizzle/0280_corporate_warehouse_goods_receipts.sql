CREATE TABLE IF NOT EXISTS "corporate_warehouse_goods_receipts" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "order_id" uuid NOT NULL REFERENCES "corporate_orders"("id") ON DELETE CASCADE,
    "vendor_purchase_order_id" uuid NOT NULL REFERENCES "corporate_fulfillment_orders"("id") ON DELETE CASCADE,
    "brand_id" uuid NOT NULL REFERENCES "brands"("id") ON DELETE RESTRICT,
    "warehouse_name" text NOT NULL,
    "received_quantity" integer NOT NULL,
    "receipt_date" date NOT NULL,
    "receiver_name" text NOT NULL,
    "delivery_reference" text,
    "status" text DEFAULT 'accepted' NOT NULL,
    "receipt_version" integer DEFAULT 1 NOT NULL,
    "is_current_accepted" boolean DEFAULT true NOT NULL,
    "created_by_user_id" text REFERENCES "users"("id") ON DELETE SET NULL,
    "reviewed_by_user_id" text REFERENCES "users"("id") ON DELETE SET NULL,
    "reviewed_at" timestamp with time zone,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "corporate_warehouse_goods_receipts_order_idx" ON "corporate_warehouse_goods_receipts" ("order_id");
CREATE INDEX IF NOT EXISTS "corporate_warehouse_goods_receipts_fo_idx" ON "corporate_warehouse_goods_receipts" ("vendor_purchase_order_id");
CREATE UNIQUE INDEX IF NOT EXISTS "corporate_warehouse_goods_receipts_current_fo_idx" ON "corporate_warehouse_goods_receipts" ("vendor_purchase_order_id") WHERE "is_current_accepted" = true;
