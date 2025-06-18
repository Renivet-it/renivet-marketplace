CREATE TABLE IF NOT EXISTS "order_return_reason_details" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"return_id" text,
	"sub_reason_id" uuid,
	"comment" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "return_address_details" RENAME TO "order_return_address_details";--> statement-breakpoint
ALTER TABLE "return_item_details" RENAME TO "order_return_item_details";--> statement-breakpoint
ALTER TABLE "return_payment_details" RENAME TO "order_return_payment_details";--> statement-breakpoint
ALTER TABLE "order_return_address_details" DROP CONSTRAINT "return_address_details_return_id_fk";
--> statement-breakpoint
ALTER TABLE "order_return_item_details" DROP CONSTRAINT "return_item_details_return_id_fk";
--> statement-breakpoint
ALTER TABLE "order_return_item_details" DROP CONSTRAINT "return_item_details_brand_id_fk";
--> statement-breakpoint
ALTER TABLE "order_return_payment_details" DROP CONSTRAINT "return_payment_details_return_id_fk";
--> statement-breakpoint
ALTER TABLE "order_return_payment_details" DROP CONSTRAINT "return_payment_details_brand_id_fk";
--> statement-breakpoint
ALTER TABLE "order_return_payment_details" DROP CONSTRAINT "return_payment_details_user_id_fk";
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "order_return_reason_details" ADD CONSTRAINT "return_reason_details_return_id_fk" FOREIGN KEY ("return_id") REFERENCES "public"."order_return_shipments"("return_order_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "order_return_reason_details" ADD CONSTRAINT "return_reason_details_sub_reason_id_fk" FOREIGN KEY ("sub_reason_id") REFERENCES "public"."reason_master"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "order_return_address_details" ADD CONSTRAINT "return_address_details_return_id_fk" FOREIGN KEY ("return_id") REFERENCES "public"."order_return_shipments"("return_order_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "order_return_item_details" ADD CONSTRAINT "return_item_details_return_id_fk" FOREIGN KEY ("return_id") REFERENCES "public"."order_return_shipments"("return_order_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "order_return_item_details" ADD CONSTRAINT "return_item_details_brand_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "order_return_payment_details" ADD CONSTRAINT "return_payment_details_return_id_fk" FOREIGN KEY ("return_id") REFERENCES "public"."order_return_shipments"("return_order_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "order_return_payment_details" ADD CONSTRAINT "return_payment_details_brand_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "order_return_payment_details" ADD CONSTRAINT "return_payment_details_user_id_fk" FOREIGN KEY ("payment_refund_requested_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "order_return_item_details" DROP COLUMN IF EXISTS "return_comment";