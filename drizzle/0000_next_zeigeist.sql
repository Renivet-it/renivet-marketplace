CREATE TABLE IF NOT EXISTS "addresses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"alias" text NOT NULL,
	"alias_slug" text NOT NULL,
	"full_name" text NOT NULL,
	"street" text NOT NULL,
	"city" text NOT NULL,
	"state" text NOT NULL,
	"zip" text NOT NULL,
	"phone" text NOT NULL,
	"type" text NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "addresses_id_unique" UNIQUE("id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "advertisements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"image_url" text NOT NULL,
	"url" text,
	"position" integer DEFAULT 0 NOT NULL,
	"height" integer DEFAULT 100 NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "advertisements_id_unique" UNIQUE("id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "home_brand_products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"image_url" text NOT NULL,
	"url" text,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "home_brand_products_id_unique" UNIQUE("id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "home_shop_by_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"image_url" text NOT NULL,
	"url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "home_shop_by_categories_id_unique" UNIQUE("id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "home_shop_by_category_title" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text DEFAULT 'Shop by Category' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "home_shop_by_category_title_id_unique" UNIQUE("id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "blog_tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"blog_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "blog_tags_id_unique" UNIQUE("id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "blogs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"description" text NOT NULL,
	"content" text NOT NULL,
	"thumbnail_url" text,
	"author_id" text NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	"published_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "blogs_id_unique" UNIQUE("id"),
	CONSTRAINT "blogs_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "brand_media_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand_id" uuid NOT NULL,
	"url" text NOT NULL,
	"type" text NOT NULL,
	"name" text NOT NULL,
	"alt" text,
	"size" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "brand_media_items_id_unique" UNIQUE("id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "brand_section_products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand_page_section_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "brand_section_products_id_unique" UNIQUE("id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "brand_page_sections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "brand_page_sections_id_unique" UNIQUE("id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "brand_subscriptions" (
	"id" text PRIMARY KEY NOT NULL,
	"plan_id" text NOT NULL,
	"brand_id" uuid NOT NULL,
	"total_count" integer DEFAULT 1 NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"start_at" timestamp NOT NULL,
	"expire_by" timestamp,
	"customer_notify" boolean DEFAULT true NOT NULL,
	"is_active" boolean DEFAULT false NOT NULL,
	"renewed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "brand_subscriptions_id_unique" UNIQUE("id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "brands_waitlist" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text NOT NULL,
	"brand_name" text NOT NULL,
	"brand_email" text NOT NULL,
	"brand_phone" text NOT NULL,
	"brand_website" text NOT NULL,
	"demo_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "brands_waitlist_id_unique" UNIQUE("id"),
	CONSTRAINT "brands_waitlist_brand_email_unique" UNIQUE("brand_email")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "banned_brand_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"member_id" text NOT NULL,
	"brand_id" uuid NOT NULL,
	"reason" text,
	"banned_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "banned_brand_members_id_unique" UNIQUE("id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "brand_confidentials" (
	"id" uuid PRIMARY KEY NOT NULL,
	"gstin" text NOT NULL,
	"pan" text NOT NULL,
	"bank_name" text NOT NULL,
	"bank_account_holder_name" text NOT NULL,
	"bank_account_number" text NOT NULL,
	"bank_ifsc_code" text NOT NULL,
	"bank_account_verification_document" text NOT NULL,
	"authorized_signatory_name" text NOT NULL,
	"authorized_signatory_email" text NOT NULL,
	"authorized_signatory_phone" text NOT NULL,
	"udyam_registration_certificate" text,
	"iec_certificate" text,
	"address_line1" text NOT NULL,
	"address_line2" text,
	"city" text NOT NULL,
	"state" text NOT NULL,
	"postal_code" text NOT NULL,
	"country" text NOT NULL,
	"is_same_as_warehouse_address" boolean DEFAULT true NOT NULL,
	"warehouse_address_line1" text,
	"warehouse_address_line2" text,
	"warehouse_city" text,
	"warehouse_state" text,
	"warehouse_postal_code" text,
	"warehouse_country" text,
	"verification_status" text DEFAULT 'pending' NOT NULL,
	"has_accepted_terms" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "brand_confidentials_id_unique" UNIQUE("id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "brand_invites" (
	"id" text PRIMARY KEY NOT NULL,
	"brand_id" uuid NOT NULL,
	"expires_at" timestamp,
	"max_uses" integer DEFAULT 0 NOT NULL,
	"uses" integer DEFAULT 0 NOT NULL,
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
	"phone" text NOT NULL,
	"message" text,
	"website" text,
	"owner_id" text NOT NULL,
	"logo_url" text NOT NULL,
	"demo_url" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"rejection_reason" text,
	"rejected_at" timestamp,
	"has_accepted_terms" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "brand_requests_id_unique" UNIQUE("id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "brands" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"rzp_account_id" text,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"email" text NOT NULL,
	"phone" text NOT NULL,
	"website" text,
	"logo_url" text NOT NULL,
	"cover_url" text,
	"owner_id" text NOT NULL,
	"bio" text,
	"confidential_verification_status" text DEFAULT 'idle' NOT NULL,
	"confidential_verification_rejected_reason" text,
	"confidential_verification_rejected_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "brands_id_unique" UNIQUE("id"),
	CONSTRAINT "brands_slug_unique" UNIQUE("slug"),
	CONSTRAINT "brands_email_unique" UNIQUE("email"),
	CONSTRAINT "brands_owner_id_unique" UNIQUE("owner_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "carts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"product_id" uuid NOT NULL,
	"variant_id" uuid,
	"quantity" integer DEFAULT 1 NOT NULL,
	"status" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "carts_id_unique" UNIQUE("id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"commission_rate" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "categories_id_unique" UNIQUE("id"),
	CONSTRAINT "categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "category_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"brand_id" uuid NOT NULL,
	"content" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"rejection_reason" text,
	"rejected_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "category_requests_id_unique" UNIQUE("id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "product_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category_id" uuid NOT NULL,
	"sub_category_id" uuid NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "product_types_id_unique" UNIQUE("id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sub_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category_id" uuid NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sub_categories_id_unique" UNIQUE("id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "home_banners" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"image_url" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "home_banners_id_unique" UNIQUE("id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "coupons" (
	"code" text PRIMARY KEY NOT NULL,
	"description" text,
	"discount_type" text NOT NULL,
	"discount_value" integer NOT NULL,
	"min_order_amount" integer DEFAULT 0 NOT NULL,
	"max_discount_amount" integer,
	"category_id" uuid,
	"sub_category_id" uuid,
	"product_type_id" uuid,
	"expires_at" timestamp,
	"max_uses" integer DEFAULT 0 NOT NULL,
	"uses" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "coupons_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "legals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"privacy_policy" text,
	"terms_of_service" text,
	"shipping_policy" text,
	"refund_policy" text,
	"pp_created_at" timestamp DEFAULT now() NOT NULL,
	"tos_created_at" timestamp DEFAULT now() NOT NULL,
	"sp_created_at" timestamp DEFAULT now() NOT NULL,
	"rp_created_at" timestamp DEFAULT now() NOT NULL,
	"pp_updated_at" timestamp DEFAULT now() NOT NULL,
	"tos_updated_at" timestamp DEFAULT now() NOT NULL,
	"sp_updated_at" timestamp DEFAULT now() NOT NULL,
	"rp_updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "legals_id_unique" UNIQUE("id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "marketing_strip" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"image_url" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "marketing_strip_id_unique" UNIQUE("id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "newsletter_subscribers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "newsletter_subscribers_id_unique" UNIQUE("id"),
	CONSTRAINT "newsletter_subscribers_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" text NOT NULL,
	"product_id" uuid NOT NULL,
	"brand_id" uuid NOT NULL,
	"variant_id" uuid,
	"sku" text,
	"quantity" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "order_items_id_unique" UNIQUE("id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "orders" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"receipt_id" text NOT NULL,
	"payment_id" text,
	"payment_method" text,
	"payment_status" text DEFAULT 'pending' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"address_id" uuid NOT NULL,
	"total_items" integer NOT NULL,
	"tax_amount" integer NOT NULL,
	"delivery_amount" integer NOT NULL,
	"discount_amount" integer DEFAULT 0 NOT NULL,
	"total_amount" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "orders_id_unique" UNIQUE("id"),
	CONSTRAINT "orders_receipt_id_unique" UNIQUE("receipt_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "order_shipment_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shipment_id" uuid NOT NULL,
	"order_item_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "order_shipment_items_id_unique" UNIQUE("id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "order_shipments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" text NOT NULL,
	"brand_id" uuid NOT NULL,
	"shiprocket_order_id" integer,
	"shiprocket_shipment_id" integer,
	"courier_company_id" integer,
	"courier_name" text,
	"awb_number" text,
	"tracking_number" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"shipment_date" timestamp,
	"estimated_delivery_date" timestamp,
	"label_url" text,
	"manifest_url" text,
	"invoice_url" text,
	"is_pickup_scheduled" boolean DEFAULT false,
	"pickup_scheduled_date" timestamp,
	"pickup_token_number" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "order_shipments_id_unique" UNIQUE("id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "plans" (
	"id" text PRIMARY KEY NOT NULL,
	"interval" integer DEFAULT 1 NOT NULL,
	"period" text DEFAULT 'monthly' NOT NULL,
	"amount" integer NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "plans_id_unique" UNIQUE("id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "product_options" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"name" text NOT NULL,
	"values" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "product_options_id_unique" UNIQUE("id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "product_values" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"data" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "product_values_id_unique" UNIQUE("id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "product_variants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"image" text,
	"combinations" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"price" integer NOT NULL,
	"compare_at_price" integer,
	"cost_per_item" integer,
	"native_sku" text NOT NULL,
	"sku" text,
	"barcode" text,
	"quantity" integer DEFAULT 0 NOT NULL,
	"weight" integer DEFAULT 0 NOT NULL,
	"length" integer DEFAULT 0 NOT NULL,
	"width" integer DEFAULT 0 NOT NULL,
	"height" integer DEFAULT 0 NOT NULL,
	"origin_country" text,
	"hs_code" text,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "product_variants_id_unique" UNIQUE("id"),
	CONSTRAINT "product_variants_native_sku_unique" UNIQUE("native_sku")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"brand_id" uuid NOT NULL,
	"is_available" boolean DEFAULT true NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_published" boolean DEFAULT true NOT NULL,
	"published_at" timestamp DEFAULT now(),
	"media" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"sustainability_certificate" text,
	"product_has_variants" boolean DEFAULT false NOT NULL,
	"category_id" uuid NOT NULL,
	"subcategory_id" uuid NOT NULL,
	"product_type_id" uuid NOT NULL,
	"price" integer,
	"compare_at_price" integer,
	"cost_per_item" integer,
	"native_sku" text,
	"sku" text,
	"barcode" text,
	"quantity" integer,
	"weight" integer,
	"length" integer,
	"width" integer,
	"height" integer,
	"origin_country" text,
	"hs_code" text,
	"meta_title" text,
	"meta_description" text,
	"meta_keywords" text[] DEFAULT '{}',
	"verification_status" text DEFAULT 'approved' NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"deleted_at" timestamp,
	"rejected_at" timestamp,
	"rejection_reason" text,
	"last_reviewed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "products_id_unique" UNIQUE("id"),
	CONSTRAINT "products_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "products_journey" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"data" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "products_journey_id_unique" UNIQUE("id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "refunds" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"order_id" text NOT NULL,
	"payment_id" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"amount" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "refunds_id_unique" UNIQUE("id"),
	CONSTRAINT "refunds_payment_id_unique" UNIQUE("payment_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "brand_roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand_id" uuid NOT NULL,
	"role_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "brand_roles_id_unique" UNIQUE("id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"site_permissions" text NOT NULL,
	"brand_permissions" text NOT NULL,
	"is_site_role" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "roles_id_unique" UNIQUE("id"),
	CONSTRAINT "roles_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tags_id_unique" UNIQUE("id"),
	CONSTRAINT "tags_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tickets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text NOT NULL,
	"company" text,
	"message" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tickets_id_unique" UNIQUE("id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_addresses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"address_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_addresses_id_unique" UNIQUE("id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"role_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_roles_id_unique" UNIQUE("id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" text PRIMARY KEY NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"avatar_url" text,
	"is_email_verified" boolean DEFAULT false NOT NULL,
	"is_phone_verified" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_id_unique" UNIQUE("id"),
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_phone_unique" UNIQUE("phone")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "wishlists" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"product_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "wishlists_id_unique" UNIQUE("id")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "addresses" ADD CONSTRAINT "addresses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "blog_tags" ADD CONSTRAINT "blog_tags_blog_id_blogs_id_fk" FOREIGN KEY ("blog_id") REFERENCES "public"."blogs"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "blog_tags" ADD CONSTRAINT "blog_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "blogs" ADD CONSTRAINT "blogs_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "brand_media_items" ADD CONSTRAINT "brand_media_items_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "brand_section_products" ADD CONSTRAINT "brand_section_products_brand_page_section_id_brand_page_sections_id_fk" FOREIGN KEY ("brand_page_section_id") REFERENCES "public"."brand_page_sections"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "brand_section_products" ADD CONSTRAINT "brand_section_products_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "brand_page_sections" ADD CONSTRAINT "brand_page_sections_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "brand_subscriptions" ADD CONSTRAINT "brand_subscriptions_plan_id_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "brand_subscriptions" ADD CONSTRAINT "brand_subscriptions_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "banned_brand_members" ADD CONSTRAINT "banned_brand_members_member_id_users_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "banned_brand_members" ADD CONSTRAINT "banned_brand_members_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "brand_confidentials" ADD CONSTRAINT "brand_confidentials_id_brands_id_fk" FOREIGN KEY ("id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
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
DO $$ BEGIN
 ALTER TABLE "brands" ADD CONSTRAINT "brands_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "carts" ADD CONSTRAINT "carts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "carts" ADD CONSTRAINT "carts_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "carts" ADD CONSTRAINT "carts_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
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
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "product_types" ADD CONSTRAINT "product_types_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "product_types" ADD CONSTRAINT "product_types_sub_category_id_sub_categories_id_fk" FOREIGN KEY ("sub_category_id") REFERENCES "public"."sub_categories"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sub_categories" ADD CONSTRAINT "sub_categories_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "coupons" ADD CONSTRAINT "coupons_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "coupons" ADD CONSTRAINT "coupons_sub_category_id_sub_categories_id_fk" FOREIGN KEY ("sub_category_id") REFERENCES "public"."sub_categories"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "coupons" ADD CONSTRAINT "coupons_product_type_id_product_types_id_fk" FOREIGN KEY ("product_type_id") REFERENCES "public"."product_types"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "order_items" ADD CONSTRAINT "order_items_brand_id_products_brand_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."products"("brand_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "order_items" ADD CONSTRAINT "order_items_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "orders" ADD CONSTRAINT "orders_address_id_addresses_id_fk" FOREIGN KEY ("address_id") REFERENCES "public"."addresses"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "order_shipment_items" ADD CONSTRAINT "order_shipment_items_shipment_id_order_shipments_id_fk" FOREIGN KEY ("shipment_id") REFERENCES "public"."order_shipments"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "order_shipment_items" ADD CONSTRAINT "order_shipment_items_order_item_id_order_items_id_fk" FOREIGN KEY ("order_item_id") REFERENCES "public"."order_items"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "order_shipments" ADD CONSTRAINT "order_shipments_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "order_shipments" ADD CONSTRAINT "order_shipments_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "product_options" ADD CONSTRAINT "product_options_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "product_values" ADD CONSTRAINT "product_values_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "products" ADD CONSTRAINT "products_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "products" ADD CONSTRAINT "products_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "products" ADD CONSTRAINT "products_subcategory_id_sub_categories_id_fk" FOREIGN KEY ("subcategory_id") REFERENCES "public"."sub_categories"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "products" ADD CONSTRAINT "products_product_type_id_product_types_id_fk" FOREIGN KEY ("product_type_id") REFERENCES "public"."product_types"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "products_journey" ADD CONSTRAINT "products_journey_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "refunds" ADD CONSTRAINT "refunds_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "refunds" ADD CONSTRAINT "refunds_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
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
DO $$ BEGIN
 ALTER TABLE "user_addresses" ADD CONSTRAINT "user_addresses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_addresses" ADD CONSTRAINT "user_addresses_address_id_addresses_id_fk" FOREIGN KEY ("address_id") REFERENCES "public"."addresses"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "wishlists" ADD CONSTRAINT "wishlists_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "wishlists" ADD CONSTRAINT "wishlists_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "address_to_user_id_idx" ON "addresses" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_id_type_alias_slug_idx" ON "addresses" USING btree ("user_id","type","alias_slug");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "alias_slug_idx" ON "addresses" USING btree ("alias_slug");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "is_primary_idx" ON "addresses" USING btree ("is_primary");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "advertisement_position_idx" ON "advertisements" USING btree ("position");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "home_brand_product_position_idx" ON "home_brand_products" USING btree ("position");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "blog_id_idx" ON "blog_tags" USING btree ("blog_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tag_id_idx" ON "blog_tags" USING btree ("tag_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "blog_tag_idx" ON "blog_tags" USING btree ("blog_id","tag_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "brand_media_item_brand_id_idx" ON "brand_media_items" USING btree ("brand_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "brand_section_product_section_id_index" ON "brand_section_products" USING btree ("brand_page_section_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "brand_section_product_product_id_index" ON "brand_section_products" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "brand_page_section_brand_id_index" ON "brand_page_sections" USING btree ("brand_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "brand_subscription_is_active_idx" ON "brand_subscriptions" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "brand_subscription_brand_id_is_active_idx" ON "brand_subscriptions" USING btree ("brand_id","is_active");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "brand_subscription_plan_id_is_active_idx" ON "brand_subscriptions" USING btree ("plan_id","is_active");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "banned_member_brand_index" ON "banned_brand_members" USING btree ("member_id","brand_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "brand_confidential_verification_status_index" ON "brand_confidentials" USING btree ("verification_status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "invite_brand_id_index" ON "brand_invites" USING btree ("brand_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "brand_member_id_index" ON "brand_members" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "member_brand_id_index" ON "brand_members" USING btree ("brand_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "brand_is_confidential_verification_status_index" ON "brands" USING btree ("confidential_verification_status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "cart_user_id_idx" ON "carts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "cart_user_id_product_id_variant_id_idx" ON "carts" USING btree ("user_id","product_id","variant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "cart_product_id_variant_id_idx" ON "carts" USING btree ("product_id","variant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "cart_user_id_product_id_idx" ON "carts" USING btree ("user_id","product_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "order_item_order_id_idx" ON "order_items" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "order_item_product_id_idx" ON "order_items" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "order_item_variant_id_idx" ON "order_items" USING btree ("variant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "order_item_product_id_variant_id_idx" ON "order_items" USING btree ("product_id","variant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "order_item_brand_id_idx" ON "order_items" USING btree ("brand_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "order_receipt_id_idx" ON "orders" USING btree ("receipt_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "order_payment_id_idx" ON "orders" USING btree ("payment_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "order_user_id_idx" ON "orders" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "order_id_user_id_idx" ON "orders" USING btree ("id","user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "order_status_idx" ON "orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "order_payment_status_idx" ON "orders" USING btree ("payment_status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "shipment_item_shipment_id_idx" ON "order_shipment_items" USING btree ("shipment_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "shipment_item_order_item_id_idx" ON "order_shipment_items" USING btree ("order_item_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "order_shipment_order_id_idx" ON "order_shipments" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "order_shipment_brand_id_idx" ON "order_shipments" USING btree ("brand_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "order_shipment_status_idx" ON "order_shipments" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "plan_is_active_idx" ON "plans" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "plan_id_is_active_idx" ON "plans" USING btree ("id","is_active");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "product_option_product_id_idx" ON "product_options" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "product_values_product_id_idx" ON "product_values" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "product_variant_product_id_idx" ON "product_variants" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "product_variant_sku_idx" ON "product_variants" USING btree ("sku");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "product_sku_idx" ON "products" USING btree ("sku");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "product_fts_idx" ON "products" USING gin ((
            setweight(to_tsvector('english', "title"), 'A') ||
            setweight(to_tsvector('english', "description"), 'B')
        ));--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "products_journey_product_id_idx" ON "products_journey" USING btree ("product_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "unique_brand_role_idx" ON "brand_roles" USING btree ("brand_id","role_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "unique_role_name_per_brand_idx" ON "brand_roles" USING btree ("brand_id","role_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_address_id_idx" ON "user_addresses" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "address_id_idx" ON "user_addresses" USING btree ("address_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_role_id_idx" ON "user_roles" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "role_id_idx" ON "user_roles" USING btree ("role_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "wishlist_user_id_idx" ON "wishlists" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "wishlist_user_id_product_id_idx" ON "wishlists" USING btree ("user_id","product_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "wishlist_product_id_idx" ON "wishlists" USING btree ("product_id");