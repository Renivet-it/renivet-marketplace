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
            "0262_corporate_document_chain.sql"
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
        await sql.begin(async (transaction) => {
            for (const statement of statements) {
                await transaction.unsafe(statement);
            }
        });
        console.log(
            `Applied ${statements.length} corporate document-chain statements.`
        );
        console.log("No notification service was called.");
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
