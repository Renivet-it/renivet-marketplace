ALTER TABLE "corporate_product_types"
ADD COLUMN IF NOT EXISTS "hsn_master_id" uuid;
--> statement-breakpoint

DO $$ BEGIN
    ALTER TABLE "corporate_product_types"
        ADD CONSTRAINT "corporate_product_types_hsn_master_id_hsn_master_id_fk"
        FOREIGN KEY ("hsn_master_id")
        REFERENCES "public"."hsn_master"("id")
        ON DELETE SET NULL
        ON UPDATE NO ACTION;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "corporate_product_types_hsn_master_id_idx"
ON "corporate_product_types" USING btree ("hsn_master_id");
