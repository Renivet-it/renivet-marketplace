ALTER TABLE "account_merge_intents"
  ALTER COLUMN "attempts" TYPE integer USING COALESCE(NULLIF("attempts"::text, ''), '0')::integer,
  ALTER COLUMN "attempts" SET DEFAULT 0;

ALTER TABLE "account_merge_intents"
  ADD COLUMN IF NOT EXISTS "consented_at" timestamp,
  ADD COLUMN IF NOT EXISTS "last_code_sent_at" timestamp,
  ADD COLUMN IF NOT EXISTS "processing_started_at" timestamp,
  ADD COLUMN IF NOT EXISTS "source_deleted_at" timestamp;

CREATE INDEX IF NOT EXISTS "account_merge_intents_status_idx"
  ON "account_merge_intents" ("status");
