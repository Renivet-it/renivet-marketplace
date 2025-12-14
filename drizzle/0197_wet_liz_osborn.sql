CREATE TABLE IF NOT EXISTS "packing_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"hs_code" text,
	"base_length" integer DEFAULT 0,
	"base_width" integer DEFAULT 0,
	"base_height" integer DEFAULT 0,
	"extra_cm" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "product_types" ADD COLUMN "packing_type_id" uuid;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "product_types" ADD CONSTRAINT "product_types_packing_type_id_packing_types_id_fk" FOREIGN KEY ("packing_type_id") REFERENCES "public"."packing_types"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
