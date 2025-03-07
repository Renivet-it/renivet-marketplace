ALTER TABLE "order_shipment_items" DROP CONSTRAINT "order_shipment_items_order_item_id_orders_id_fk";
--> statement-breakpoint
ALTER TABLE "order_shipment_items" ALTER COLUMN "order_item_id" TYPE uuid USING order_item_id::uuid;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "order_shipment_items" ADD CONSTRAINT "order_shipment_items_order_item_id_order_items_id_fk" FOREIGN KEY ("order_item_id") REFERENCES "public"."order_items"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
