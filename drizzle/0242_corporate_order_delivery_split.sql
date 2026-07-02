ALTER TABLE "corporate_orders" ADD COLUMN "delivery_country" text;
ALTER TABLE "corporate_orders" ADD COLUMN "delivery_city" text;
ALTER TABLE "corporate_orders" ADD COLUMN "delivery_pincode" text;

UPDATE "corporate_orders"
SET
    "delivery_country" = COALESCE(NULLIF("delivery_country", ''), 'Unknown'),
    "delivery_city" = COALESCE(NULLIF("delivery_city", ''), 'Unknown'),
    "delivery_pincode" = COALESCE(NULLIF("delivery_pincode", ''), '000000'),
    "delivery_address" = COALESCE(NULLIF("delivery_address", ''), 'Address not provided');

ALTER TABLE "corporate_orders" ALTER COLUMN "delivery_country" SET NOT NULL;
ALTER TABLE "corporate_orders" ALTER COLUMN "delivery_city" SET NOT NULL;
ALTER TABLE "corporate_orders" ALTER COLUMN "delivery_pincode" SET NOT NULL;
