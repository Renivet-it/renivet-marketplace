ALTER TABLE "corporate_proforma_invoices"
ALTER COLUMN "quote_id" DROP NOT NULL;
--> statement-breakpoint

ALTER TABLE "corporate_proforma_invoices"
ADD COLUMN IF NOT EXISTS "order_id" uuid;
--> statement-breakpoint

DO $$ BEGIN
    ALTER TABLE "corporate_proforma_invoices"
        ADD CONSTRAINT "corporate_proforma_invoices_order_id_corporate_orders_id_fk"
        FOREIGN KEY ("order_id")
        REFERENCES "public"."corporate_orders"("id")
        ON DELETE CASCADE
        ON UPDATE NO ACTION;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "corporate_proforma_invoices_order_id_idx"
ON "corporate_proforma_invoices" USING btree ("order_id");
