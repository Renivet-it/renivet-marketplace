ALTER TABLE "corporate_quotes"
ADD COLUMN IF NOT EXISTS "product_type_id" uuid;
--> statement-breakpoint
ALTER TABLE "corporate_quotes"
ADD COLUMN IF NOT EXISTS "gsm_option_id" uuid;
--> statement-breakpoint
ALTER TABLE "corporate_quotes"
ADD COLUMN IF NOT EXISTS "fabric_composition_id" uuid;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "corporate_quotes" ADD CONSTRAINT "corporate_quotes_product_type_id_corporate_product_types_id_fk" FOREIGN KEY ("product_type_id") REFERENCES "public"."corporate_product_types"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "corporate_quotes" ADD CONSTRAINT "corporate_quotes_gsm_option_id_corporate_gsm_options_id_fk" FOREIGN KEY ("gsm_option_id") REFERENCES "public"."corporate_gsm_options"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "corporate_quotes" ADD CONSTRAINT "corporate_quotes_fabric_composition_id_corporate_fabric_compositions_id_fk" FOREIGN KEY ("fabric_composition_id") REFERENCES "public"."corporate_fabric_compositions"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
