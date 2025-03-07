ALTER TABLE "brand_media_items" RENAME COLUMN "media_url" TO "url";--> statement-breakpoint
ALTER TABLE "brand_media_items" RENAME COLUMN "media_type" TO "type";--> statement-breakpoint
ALTER TABLE "brand_media_items" ADD COLUMN "name" text NOT NULL;--> statement-breakpoint
ALTER TABLE "brand_media_items" ADD COLUMN "alt" text NOT NULL;