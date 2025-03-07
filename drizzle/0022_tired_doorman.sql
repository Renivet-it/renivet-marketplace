CREATE TABLE IF NOT EXISTS "brand_roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand_id" uuid NOT NULL,
	"role_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "brand_roles_id_unique" UNIQUE("id")
);
--> statement-breakpoint
ALTER TABLE "roles" ADD COLUMN "is_site_role" boolean DEFAULT false NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "brand_roles" ADD CONSTRAINT "brand_roles_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "brand_roles" ADD CONSTRAINT "brand_roles_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "unique_brand_role_idx" ON "brand_roles" USING btree ("brand_id","role_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "unique_role_name_per_brand_idx" ON "brand_roles" USING btree ("brand_id","role_id");