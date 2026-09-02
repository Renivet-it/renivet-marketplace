ALTER TABLE "corporate_qc_submissions"
ADD COLUMN IF NOT EXISTS "review_notes" text;
--> statement-breakpoint

ALTER TABLE "corporate_qc_submissions"
ALTER COLUMN "reviewed_at" TYPE timestamp
USING "reviewed_at"::timestamp;
