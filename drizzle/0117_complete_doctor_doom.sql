ALTER TABLE "category_requests" RENAME COLUMN "requested_by_user" TO "user_id";--> statement-breakpoint
ALTER TABLE "category_requests" RENAME COLUMN "requested_by_brand" TO "brand_id";--> statement-breakpoint
ALTER TABLE "category_requests" DROP CONSTRAINT "category_requests_requested_by_user_users_id_fk";
--> statement-breakpoint
ALTER TABLE "category_requests" DROP CONSTRAINT "category_requests_requested_by_brand_brands_id_fk";
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "category_requests" ADD CONSTRAINT "category_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "category_requests" ADD CONSTRAINT "category_requests_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
