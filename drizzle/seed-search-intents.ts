/**
 * Seed script to import search intents from CSV file
 *
 * Usage:
 *   1. Place your CSV file at: drizzle/renivet_intent_table_phase1.csv
 *   2. Run: npx tsx drizzle/seed-search-intents.ts
 *
 * Expected CSV columns:
 *   - keyword: The search keyword (e.g., "bags", "kurta")
 *   - intent_type: CATEGORY or PRODUCT
 *   - category_ids: Pipe-separated path (e.g., "Women|Bags")
 *   - priority: high, medium, or low
 *   - source: category, subcategory, or product_type
 */

import * as fs from "fs";
import * as path from "path";
import dotenv from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import Papa from "papaparse";
import postgres from "postgres";
import { searchIntents } from "../src/lib/db/schema/search";

// Load environment variables
dotenv.config();

interface IntentRow {
    keyword: string;
    intent_type: string;
    category_ids: string;
    priority: string;
    source: string;
}

async function seedSearchIntents() {
    console.log("🔍 Reading CSV file...");

    // Database connection
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        console.error("❌ DATABASE_URL not found in environment variables");
        process.exit(1);
    }

    const client = postgres(connectionString);
    const db = drizzle(client);

    // Path to your CSV file
    const csvPath = path.join(
        process.cwd(),
        "drizzle",
        "renivet_intent_table_phase1.csv"
    );

    try {
        // Read the CSV file
        const csvContent = fs.readFileSync(csvPath, "utf-8");

        // Parse CSV
        const parseResult = Papa.parse<IntentRow>(csvContent, {
            header: true,
            skipEmptyLines: true,
        });

        const rows = parseResult.data;

        console.log(`📊 Found ${rows.length} rows in CSV file`);

        // Validate and prepare data
        const validRows = rows
            .filter((row) => {
                // Validate required fields
                if (!row.keyword || !row.intent_type || !row.category_ids) {
                    console.warn("⚠️ Skipping row with missing data:", row);
                    return false;
                }
                return true;
            })
            .map((row) => ({
                keyword: row.keyword.toLowerCase().trim(),
                intentType: row.intent_type.toUpperCase() as
                    | "CATEGORY"
                    | "PRODUCT"
                    | "BRAND",
                categoryIds: row.category_ids.trim(),
                priority: (row.priority?.toLowerCase() || "medium") as
                    | "high"
                    | "medium"
                    | "low",
                source: (row.source?.toLowerCase() || "manual") as
                    | "category"
                    | "subcategory"
                    | "product_type"
                    | "manual",
            }));

        console.log(`✅ Validated ${validRows.length} rows`);

        // Insert into database
        let inserted = 0;
        let skipped = 0;

        for (const row of validRows) {
            try {
                await db
                    .insert(searchIntents)
                    .values(row)
                    .onConflictDoNothing({ target: searchIntents.keyword });
                inserted++;
                if (inserted % 10 === 0) {
                    console.log(
                        `   Inserted ${inserted}/${validRows.length}...`
                    );
                }
            } catch (error) {
                console.warn(`⚠️ Error inserting "${row.keyword}":`, error);
                skipped++;
            }
        }

        console.log("\n📈 Seed Summary:");
        console.log(`   ✅ Inserted: ${inserted} keywords`);
        console.log(
            `   ⏭️ Skipped: ${skipped} keywords (duplicates or errors)`
        );
        console.log("\n🎉 Seeding complete!");

        await client.end();
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code === "ENOENT") {
            console.error(`❌ CSV file not found at: ${csvPath}`);
            console.log("\n📝 Please create the file with these columns:");
            console.log("   - keyword");
            console.log("   - intent_type (CATEGORY or PRODUCT)");
            console.log("   - category_ids (e.g., 'Women|Bags')");
            console.log("   - priority (high, medium, low)");
            console.log("   - source (category, subcategory, product_type)");
        } else {
            console.error("❌ Error:", error);
        }
        process.exit(1);
    }

    process.exit(0);
}

seedSearchIntents();
