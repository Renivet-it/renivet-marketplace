ALTER TABLE "corporate_orders"
ADD COLUMN "quote_id" uuid;

ALTER TABLE "corporate_orders"
ADD COLUMN "brand_id" uuid;

DO $$ BEGIN
 ALTER TABLE "corporate_orders"
 ADD CONSTRAINT "corporate_orders_quote_id_corporate_quotes_id_fk"
 FOREIGN KEY ("quote_id") REFERENCES "public"."corporate_quotes"("id")
 ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "corporate_orders"
 ADD CONSTRAINT "corporate_orders_brand_id_brands_id_fk"
 FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id")
 ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

CREATE INDEX IF NOT EXISTS "corporate_orders_quote_idx"
ON "corporate_orders" USING btree ("quote_id");

CREATE INDEX IF NOT EXISTS "corporate_orders_brand_idx"
ON "corporate_orders" USING btree ("brand_id");

UPDATE "corporate_orders" AS "co"
SET
    "quote_id" = "po"."quote_id",
    "updated_at" = NOW()
FROM "corporate_purchase_orders" AS "po"
WHERE
    "po"."corporate_order_id" = "co"."id"
    AND "co"."quote_id" IS NULL
    AND "po"."quote_id" IS NOT NULL;

WITH "matched_by_quote_id" AS (
    SELECT
        "co"."id" AS "order_id",
        "cq"."id" AS "quote_id",
        "cq"."brand_id" AS "brand_id",
        ROW_NUMBER() OVER (
            PARTITION BY "co"."id"
            ORDER BY "cq"."created_at" DESC
        ) AS "rn"
    FROM "corporate_orders" AS "co"
    INNER JOIN "corporate_quotes" AS "cq"
        ON "co"."internal_notes" LIKE ('%' || 'quote:' || "cq"."id"::text || '%')
    WHERE "co"."quote_id" IS NULL
)
UPDATE "corporate_orders" AS "co"
SET
    "quote_id" = "matched_by_quote_id"."quote_id",
    "brand_id" = COALESCE("co"."brand_id", "matched_by_quote_id"."brand_id"),
    "updated_at" = NOW()
FROM "matched_by_quote_id"
WHERE
    "matched_by_quote_id"."rn" = 1
    AND "co"."id" = "matched_by_quote_id"."order_id";

WITH "matched_by_quote_number" AS (
    SELECT
        "co"."id" AS "order_id",
        "cq"."id" AS "quote_id",
        "cq"."brand_id" AS "brand_id",
        ROW_NUMBER() OVER (
            PARTITION BY "co"."id"
            ORDER BY "cq"."created_at" DESC
        ) AS "rn"
    FROM "corporate_orders" AS "co"
    INNER JOIN "corporate_quotes" AS "cq"
        ON (
            "co"."customer_notes" LIKE ('%' || "cq"."quote_number" || '%')
            OR "co"."internal_notes" LIKE ('%' || "cq"."quote_number" || '%')
        )
    WHERE "co"."quote_id" IS NULL
)
UPDATE "corporate_orders" AS "co"
SET
    "quote_id" = "matched_by_quote_number"."quote_id",
    "brand_id" = COALESCE("co"."brand_id", "matched_by_quote_number"."brand_id"),
    "updated_at" = NOW()
FROM "matched_by_quote_number"
WHERE
    "matched_by_quote_number"."rn" = 1
    AND "matched_by_quote_number"."rn" = 1
    AND "co"."id" = "matched_by_quote_number"."order_id";

UPDATE "corporate_orders" AS "co"
SET
    "brand_id" = "cq"."brand_id",
    "updated_at" = NOW()
FROM "corporate_quotes" AS "cq"
WHERE
    "co"."quote_id" = "cq"."id"
    AND "co"."brand_id" IS NULL;
