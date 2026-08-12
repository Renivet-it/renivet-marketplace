ALTER TABLE "corporate_profiles"
    ALTER COLUMN "user_id" DROP NOT NULL;

CREATE INDEX IF NOT EXISTS "corporate_profiles_email_idx"
    ON "corporate_profiles" ("email");
