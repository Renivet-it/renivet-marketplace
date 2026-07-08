ALTER TABLE "module_access"
ADD COLUMN IF NOT EXISTS "granted_at" timestamp DEFAULT now() NOT NULL;

ALTER TABLE "module_access"
ADD COLUMN IF NOT EXISTS "revoked_at" timestamp;

ALTER TABLE "pl_manual_entries"
ADD COLUMN IF NOT EXISTS "month" text;

ALTER TABLE "pl_manual_entries"
ADD COLUMN IF NOT EXISTS "line_item" text;

ALTER TABLE "pl_manual_entries"
ADD COLUMN IF NOT EXISTS "sub_label" text;

ALTER TABLE "pl_manual_entries"
ADD COLUMN IF NOT EXISTS "entered_by" text REFERENCES "users"("id") ON DELETE SET NULL;

ALTER TABLE "pl_manual_entries"
ADD COLUMN IF NOT EXISTS "entered_at" timestamp;

ALTER TABLE "pl_manual_entries"
ADD COLUMN IF NOT EXISTS "is_locked" boolean DEFAULT false NOT NULL;

ALTER TABLE "pl_snapshots"
ADD COLUMN IF NOT EXISTS "month" text;

UPDATE "module_access"
SET "granted_at" = COALESCE("granted_at", "created_at", now());

UPDATE "pl_manual_entries"
SET
    "month" = COALESCE("month", "month_key"),
    "line_item" = COALESCE("line_item", "category"),
    "entered_by" = COALESCE("entered_by", "created_by"),
    "entered_at" = COALESCE("entered_at", "created_at"),
    "is_locked" = COALESCE("is_locked", CASE WHEN "locked_at" IS NOT NULL THEN true ELSE false END);

UPDATE "pl_snapshots"
SET "month" = COALESCE("month", "month_key");
