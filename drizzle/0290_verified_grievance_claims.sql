CREATE TABLE IF NOT EXISTS "grievance_claims" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "token_hash" text NOT NULL,
    "name" text NOT NULL,
    "email" text NOT NULL,
    "phone" text NOT NULL,
    "order_id" text,
    "category" text NOT NULL,
    "description" text NOT NULL,
    "expected_user_id" text,
    "consented_at" timestamp,
    "expires_at" timestamp NOT NULL,
    "consumed_at" timestamp,
    "consumed_by_user_id" text,
    "ticket_id" uuid,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "grievance_claims_token_hash_idx" ON "grievance_claims" ("token_hash");
CREATE INDEX IF NOT EXISTS "grievance_claims_expires_at_idx" ON "grievance_claims" ("expires_at");
CREATE INDEX IF NOT EXISTS "grievance_claims_consumed_by_user_idx" ON "grievance_claims" ("consumed_by_user_id");

-- If the table was created by the earlier unregistered migration, add the
-- ownership column without changing existing claim rows.
ALTER TABLE "grievance_claims"
    ADD COLUMN IF NOT EXISTS "expected_user_id" text;
ALTER TABLE "grievance_claims"
    ALTER COLUMN "consented_at" DROP NOT NULL;
