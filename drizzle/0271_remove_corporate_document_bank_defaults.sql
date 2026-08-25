ALTER TABLE "corporate_document_settings"
ALTER COLUMN "bank_account_number" DROP DEFAULT;
--> statement-breakpoint

ALTER TABLE "corporate_document_settings"
ALTER COLUMN "bank_ifsc_code" DROP DEFAULT;
--> statement-breakpoint

ALTER TABLE "corporate_document_settings"
ALTER COLUMN "bank_branch" DROP DEFAULT;
