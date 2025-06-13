CREATE TABLE IF NOT EXISTS "return_address_details" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"return_id" uuid,
	"customer_name" text,
	"pickup_address" text,
	"pickup_city" text,
	"pickup_state" text,
	"pickup_country" text,
	"pickup_pincode" text,
	"pickup_email" text,
	"pickup_phone" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "return_item_details" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"delivered_order_id" uuid,
	"return_id" uuid,
	"brand_id" uuid,
	"product_name" text,
	"sku" text,
	"units" integer,
	"selling_price" integer,
	"return_comment" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "return_payment_details" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"return_id" uuid,
	"payment_refund_requested_user_id" uuid,
	"brand_id" uuid,
	"account_holder_name" text,
	"account_number" text,
	"ifsc_code" text,
	"bank_name" text,
	"branch" text,
	"payment_method" text,
	"amount" integer,
	"status" text,
	"transaction_id" text,
	"transaction_date" date,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "order_return_shipments" ADD COLUMN "is_payable" boolean DEFAULT false;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "return_address_details" ADD CONSTRAINT "return_address_details_return_id_fk" FOREIGN KEY ("return_id") REFERENCES "public"."order_return_shipments"("return_order_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "return_item_details" ADD CONSTRAINT "return_item_details_return_id_fk" FOREIGN KEY ("return_id") REFERENCES "public"."order_return_shipments"("return_order_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "return_item_details" ADD CONSTRAINT "return_item_details_brand_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "return_payment_details" ADD CONSTRAINT "return_payment_details_return_id_fk" FOREIGN KEY ("return_id") REFERENCES "public"."order_return_shipments"("return_order_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "return_payment_details" ADD CONSTRAINT "return_payment_details_brand_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "return_payment_details" ADD CONSTRAINT "return_payment_details_user_id_fk" FOREIGN KEY ("payment_refund_requested_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
