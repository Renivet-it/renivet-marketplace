ALTER TABLE "roles" RENAME COLUMN "permissions" TO "site_permissions";--> statement-breakpoint
ALTER TABLE "roles" ALTER COLUMN "site_permissions" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "roles" ALTER COLUMN "site_permissions" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "roles" ADD COLUMN "brand_permissions" text NOT NULL;