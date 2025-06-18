CREATE TABLE IF NOT EXISTS "reason_master" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text,
	"description" text,
	"parent_id" uuid,
	"level" bigint,
	"is_active" boolean DEFAULT true,
	"short_order" bigint,
	"reason_type" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "type_masters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text,
	"name" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "code_unique_idx" UNIQUE("code")
);
--> statement-breakpoint
DROP INDEX IF EXISTS "product_fts_idx";--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "embeddings" vector(384);--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "reason_master" ADD CONSTRAINT "reason_master_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."reason_master"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "reason_master" ADD CONSTRAINT "reason_master_reason_type_fkey" FOREIGN KEY ("reason_type") REFERENCES "public"."type_masters"("code") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "product_embedding_idx" ON "products" USING ivfflat ("embeddings" vector_cosine_ops) WITH (lists=100);