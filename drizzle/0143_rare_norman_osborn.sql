ALTER TABLE "order_shipments" ADD COLUMN "awb_details_shiprocket_json" jsonb DEFAULT '{}'::jsonb;
ALTER TABLE "order_shipments" ADD COLUMN "pick_up_details_shiprocket_json" jsonb DEFAULT '{}'::jsonb;