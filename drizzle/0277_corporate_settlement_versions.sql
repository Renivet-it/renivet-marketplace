ALTER TABLE "corporate_settlement_statements"
ADD COLUMN "version" integer NOT NULL DEFAULT 1;
--> statement-breakpoint

ALTER TABLE "corporate_settlement_statements"
ADD COLUMN "supersedes_statement_id" uuid;
--> statement-breakpoint

ALTER TABLE "corporate_settlement_statements"
ADD COLUMN "is_current" boolean NOT NULL DEFAULT true;
--> statement-breakpoint

ALTER TABLE "corporate_settlement_statements"
ADD COLUMN "issued_by_user_id" text REFERENCES "users"("id") ON DELETE SET NULL;
--> statement-breakpoint

ALTER TABLE "corporate_settlement_statements"
ADD COLUMN "adjustment_reason" text;
--> statement-breakpoint

ALTER TABLE "corporate_settlement_statements"
ALTER COLUMN "tcs_percent_bps" SET DEFAULT 0;
--> statement-breakpoint

ALTER TABLE "corporate_settlement_statements"
ALTER COLUMN "tds_percent_bps" SET DEFAULT 0;
--> statement-breakpoint

CREATE UNIQUE INDEX "corporate_settlement_statements_current_order_idx"
ON "corporate_settlement_statements" USING btree ("order_id")
WHERE "is_current" = true;
