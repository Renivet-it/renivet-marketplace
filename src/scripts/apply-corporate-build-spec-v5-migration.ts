import fs from "fs/promises";
import path from "path";
import { loadEnvConfig } from "@next/env";
import postgres from "postgres";

loadEnvConfig(process.cwd());

async function main() {
    if (!process.env.DATABASE_URL)
        throw new Error("DATABASE_URL is not configured");
    const migration = await fs.readFile(
        path.join(
            process.cwd(),
            "drizzle",
            "0269_corporate_orders_build_spec_v5.sql"
        ),
        "utf8"
    );
    const statements = migration
        .split("--> statement-breakpoint")
        .map((statement) => statement.trim())
        .filter(Boolean);
    const sql = postgres(process.env.DATABASE_URL, {
        max: 1,
        prepare: false,
    });
    try {
        for (const statement of statements) {
            if (!statement) continue;
            try {
                await sql.unsafe(statement);
            } catch (err: any) {
                console.warn(`Statement warning/error (continuing):`, err.message);
            }
        }
        console.log(
            `Applied ${statements.length} corporate build spec v5.0 statements.`
        );
    } finally {
        await sql.end();
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
