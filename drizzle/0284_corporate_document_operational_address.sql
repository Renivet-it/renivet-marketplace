ALTER TABLE "corporate_document_settings"
    ADD COLUMN IF NOT EXISTS "operational_address_line_1" text;
--> statement-breakpoint
ALTER TABLE "corporate_document_settings"
    ADD COLUMN IF NOT EXISTS "operational_address_line_2" text;
--> statement-breakpoint
ALTER TABLE "corporate_document_settings"
    ADD COLUMN IF NOT EXISTS "operational_city" text;
--> statement-breakpoint
ALTER TABLE "corporate_document_settings"
    ADD COLUMN IF NOT EXISTS "operational_state" text;
--> statement-breakpoint
ALTER TABLE "corporate_document_settings"
    ADD COLUMN IF NOT EXISTS "operational_postal_code" text;
--> statement-breakpoint
ALTER TABLE "corporate_document_settings"
    ADD COLUMN IF NOT EXISTS "operational_country" text;
