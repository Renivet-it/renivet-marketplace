ALTER TABLE "order_return_item_details" ALTER COLUMN "delivered_order_id" SET DATA TYPE text;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "order_return_item_details" ADD CONSTRAINT "return_item_details_order_id_fk" FOREIGN KEY ("delivered_order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
