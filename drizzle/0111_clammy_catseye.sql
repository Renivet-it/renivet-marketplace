ALTER TABLE "wishlists" DROP CONSTRAINT "wishlists_variant_id_product_variants_id_fk";
--> statement-breakpoint
DROP INDEX IF EXISTS "wishlist_variant_id_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "wishlist_product_id_variant_id_idx";--> statement-breakpoint
ALTER TABLE "wishlists" DROP COLUMN IF EXISTS "variant_id";