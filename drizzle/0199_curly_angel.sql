ALTER TABLE "product_types" ADD COLUMN "is_fragile" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "product_types" ADD COLUMN "ships_in_own_box" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "product_types" ADD COLUMN "can_override" boolean DEFAULT false;