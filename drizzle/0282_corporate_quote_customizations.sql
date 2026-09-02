ALTER TABLE "corporate_quotes"
ADD COLUMN IF NOT EXISTS "customizations" jsonb NOT NULL DEFAULT '[]'::jsonb;
