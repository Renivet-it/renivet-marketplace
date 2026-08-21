CREATE TABLE IF NOT EXISTS "account_merge_intents" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "source_user_id" text NOT NULL,
  "target_user_id" text NOT NULL,
  "target_email" text NOT NULL,
  "verification_code_hash" text NOT NULL,
  "attempts" text DEFAULT '0' NOT NULL,
  "status" text DEFAULT 'pending' NOT NULL,
  "expires_at" timestamp NOT NULL,
  "completed_at" timestamp,
  "error" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "account_merge_intents_source_user_idx" ON "account_merge_intents" ("source_user_id");
CREATE INDEX IF NOT EXISTS "account_merge_intents_target_user_idx" ON "account_merge_intents" ("target_user_id");
