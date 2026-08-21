import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

async function run() {
    console.log("Creating corporate_settlement_statements table...");
    await db.execute(sql`
        CREATE TABLE IF NOT EXISTS "corporate_settlement_statements" (
            "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
            "order_id" uuid NOT NULL REFERENCES "public"."corporate_orders"("id") ON DELETE CASCADE,
            "brand_id" uuid NOT NULL REFERENCES "public"."brands"("id") ON DELETE CASCADE,
            "statement_number" text NOT NULL,
            "statement_date" date NOT NULL,
            "gross_paid_paise" integer NOT NULL,
            "gst_embedded_paise" integer NOT NULL,
            "taxable_value_paise" integer NOT NULL,
            "commission_percent_bps" integer NOT NULL,
            "commission_amount_paise" integer NOT NULL,
            "commission_gst_rate_bps" integer DEFAULT 1800 NOT NULL,
            "commission_gst_amount_paise" integer NOT NULL,
            "tcs_percent_bps" integer DEFAULT 50 NOT NULL,
            "tcs_amount_paise" integer NOT NULL,
            "tds_percent_bps" integer DEFAULT 10 NOT NULL,
            "tds_amount_paise" integer NOT NULL,
            "net_remittance_paise" integer NOT NULL,
            "status" text DEFAULT 'issued' NOT NULL,
            "notes" text,
            "created_at" timestamp DEFAULT now() NOT NULL,
            "updated_at" timestamp DEFAULT now() NOT NULL
        );

        CREATE UNIQUE INDEX IF NOT EXISTS "corporate_settlement_statements_number_idx"
            ON "corporate_settlement_statements" ("statement_number");
        CREATE INDEX IF NOT EXISTS "corporate_settlement_statements_order_idx"
            ON "corporate_settlement_statements" ("order_id");
        CREATE INDEX IF NOT EXISTS "corporate_settlement_statements_brand_idx"
            ON "corporate_settlement_statements" ("brand_id");
    `);
    console.log("✓ corporate_settlement_statements table created successfully!");
    process.exit(0);
}

run().catch((e) => {
    console.error(e);
    process.exit(1);
});
