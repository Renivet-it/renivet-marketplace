ALTER TABLE "products"
ADD COLUMN "qc_status" text DEFAULT 'pass' NOT NULL,
ADD COLUMN "qc_score" integer DEFAULT 100 NOT NULL,
ADD COLUMN "qc_last_checked_at" timestamp,
ADD COLUMN "qc_findings" jsonb DEFAULT '[]'::jsonb NOT NULL,
ADD COLUMN "qc_suggested_fixes" text[] DEFAULT '{}' NOT NULL,
ADD COLUMN "qc_reviewed_at" timestamp,
ADD COLUMN "qc_reviewed_by" text,
ADD COLUMN "qc_escalated_to" text,
ADD COLUMN "qc_owner" text DEFAULT 'system' NOT NULL,
ADD COLUMN "inventory_last_synced_at" timestamp,
ADD COLUMN "inventory_source" text DEFAULT 'manual' NOT NULL;

CREATE INDEX "product_qc_status_idx" ON "products" USING btree ("qc_status");
CREATE INDEX "product_inventory_sync_idx" ON "products" USING btree ("inventory_last_synced_at");
