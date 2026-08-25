ALTER TABLE "corporate_document_settings"
ALTER COLUMN "bank_name" SET DEFAULT 'IDFC First Bank';
--> statement-breakpoint

ALTER TABLE "corporate_document_settings"
ALTER COLUMN "bank_account_name" SET DEFAULT 'Renivet Solutions Pvt Ltd';
--> statement-breakpoint

ALTER TABLE "corporate_document_settings"
ALTER COLUMN "bank_account_type" SET DEFAULT 'Business';
--> statement-breakpoint

UPDATE "corporate_document_settings"
SET
    "bank_name" = 'IDFC First Bank',
    "bank_account_name" = 'Renivet Solutions Pvt Ltd',
    "bank_account_type" = 'Business',
    "bank_branch" = NULL;
