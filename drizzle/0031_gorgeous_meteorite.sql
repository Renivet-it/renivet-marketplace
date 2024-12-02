ALTER TABLE "products" ADD COLUMN "sizes" jsonb DEFAULT '[{"name":"One Size","quantity":0}]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN IF EXISTS "quantity";