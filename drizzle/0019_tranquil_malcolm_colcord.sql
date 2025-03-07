CREATE TABLE IF NOT EXISTS "brand_invites" (
	"id" text PRIMARY KEY NOT NULL,
	"brand_id" uuid NOT NULL,
	"expires_at" timestamp,
	"max_uses" integer DEFAULT 0,
	"uses" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "brand_invites_id_unique" UNIQUE("id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "brand_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"member_id" text NOT NULL,
	"brand_id" uuid NOT NULL,
	"is_owner" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "brand_members_id_unique" UNIQUE("id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "brand_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"website" text NOT NULL,
	"owner_id" text NOT NULL,
	"demo_url" text,
	"logo_url" text,
	"message" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"rejection_reason" text,
	"rejected_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "brand_requests_id_unique" UNIQUE("id"),
	CONSTRAINT "brand_requests_email_unique" UNIQUE("email"),
	CONSTRAINT "brand_requests_owner_id_unique" UNIQUE("owner_id")
);
--> statement-breakpoint
ALTER TABLE "brands" RENAME COLUMN "registered_by" TO "owner_id";--> statement-breakpoint
ALTER TABLE "brands" DROP CONSTRAINT "brands_name_unique";--> statement-breakpoint
ALTER TABLE "brands" DROP CONSTRAINT "brands_registered_by_users_id_fk";
--> statement-breakpoint
ALTER TABLE "brands" ADD COLUMN "email" text NOT NULL;--> statement-breakpoint
ALTER TABLE "brands" ADD COLUMN "website" text NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "brand_invites" ADD CONSTRAINT "brand_invites_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "brand_members" ADD CONSTRAINT "brand_members_member_id_users_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "brand_members" ADD CONSTRAINT "brand_members_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "brand_requests" ADD CONSTRAINT "brand_requests_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "invite_brand_id_index" ON "brand_invites" USING btree ("brand_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "brand_member_id_index" ON "brand_members" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "member_brand_id_index" ON "brand_members" USING btree ("brand_id");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "brands" ADD CONSTRAINT "brands_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "brands" ADD CONSTRAINT "brands_email_unique" UNIQUE("email");--> statement-breakpoint
ALTER TABLE "brands" ADD CONSTRAINT "brands_owner_id_unique" UNIQUE("owner_id");