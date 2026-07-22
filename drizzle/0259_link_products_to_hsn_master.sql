ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "hsn_master_id" uuid;
--> statement-breakpoint
ALTER TABLE "product_variants" ADD COLUMN IF NOT EXISTS "hsn_master_id" uuid;
--> statement-breakpoint

-- Preserve existing codes and link every exact match to the central HSN master.
UPDATE "products" AS product
SET "hsn_master_id" = master."id"
FROM "hsn_master" AS master
WHERE product."hs_code" = master."hsn_code"
  AND product."hsn_master_id" IS NULL;
--> statement-breakpoint
UPDATE "product_variants" AS variant
SET "hsn_master_id" = master."id"
FROM "hsn_master" AS master
WHERE variant."hs_code" = master."hsn_code"
  AND variant."hsn_master_id" IS NULL;
--> statement-breakpoint

DO $$ BEGIN
    ALTER TABLE "products"
        ADD CONSTRAINT "products_hsn_master_id_hsn_master_id_fk"
        FOREIGN KEY ("hsn_master_id") REFERENCES "public"."hsn_master"("id")
        ON DELETE SET NULL ON UPDATE NO ACTION;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "product_variants"
        ADD CONSTRAINT "product_variants_hsn_master_id_hsn_master_id_fk"
        FOREIGN KEY ("hsn_master_id") REFERENCES "public"."hsn_master"("id")
        ON DELETE SET NULL ON UPDATE NO ACTION;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "products_hsn_master_id_idx" ON "products" USING btree ("hsn_master_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "product_variants_hsn_master_id_idx" ON "product_variants" USING btree ("hsn_master_id");
