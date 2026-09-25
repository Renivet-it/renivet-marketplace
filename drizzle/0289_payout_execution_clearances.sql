CREATE TABLE IF NOT EXISTS "payout_execution_clearances" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cycle_id" uuid NOT NULL,
	"cleared_by" text NOT NULL,
	"evidence_reference" text NOT NULL,
	"transaction_validation_reference" text NOT NULL,
	"transaction_validated_at" timestamp NOT NULL,
	"cleared_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp,
	"revoked_at" timestamp,
	"revoked_by" text,
	"revocation_reason" text,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "payout_execution_clearances_cycle_fk" FOREIGN KEY ("cycle_id") REFERENCES "brand_payout_cycles"("id") ON DELETE CASCADE,
	CONSTRAINT "payout_execution_clearances_cleared_by_fk" FOREIGN KEY ("cleared_by") REFERENCES "users"("id") ON DELETE RESTRICT,
	CONSTRAINT "payout_execution_clearances_revoked_by_fk" FOREIGN KEY ("revoked_by") REFERENCES "users"("id") ON DELETE SET NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "payout_execution_clearances_cycle_idx"
	ON "payout_execution_clearances" ("cycle_id", "created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "payout_execution_clearances_active_idx"
	ON "payout_execution_clearances" ("cycle_id", "revoked_at", "expires_at");
