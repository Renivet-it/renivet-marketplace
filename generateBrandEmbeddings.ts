import { db } from "@/lib/db";
import { brands } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { getEmbedding } from "@/lib/python/sematic-search";

async function generateBrandEmbeddings() {
  console.log("🚀 Starting brand embedding generation...");

  // Disable statement timeout for this DB session
  await db.execute(sql`SET statement_timeout = 0;`);

  // Fetch brands (including embeddings so we can skip processed)
  const allBrands = await db.query.brands.findMany({
    columns: { id: true, name: true, embeddings: true },
  });

  console.log(`🟦 Found ${allBrands.length} brands.`);

  for (const brand of allBrands) {
    // Skip invalid or already processed brands
    if (!brand.name) {
      console.warn(`⚠️ Skipping brand with missing name (id: ${brand.id})`);
      continue;
    }
    if (brand.embeddings) {
      console.log(`⏭️ Skipping already processed brand: ${brand.name}`);
      continue;
    }

    let retries = 3;
    while (retries > 0) {
      try {
        const name = brand.name.trim();
        console.log(`🧠 Generating embedding for "${name}"...`);

        const embedding = await getEmbedding(name);

        if (!Array.isArray(embedding) || embedding.length !== 384) {
          throw new Error("Invalid embedding length");
        }

        await db
          .update(brands)
          .set({ embeddings: embedding })
          .where(eq(brands.id, brand.id));

        console.log(`✅ Saved embedding for brand: ${brand.name}`);
        break; // success, exit retry loop
      } catch (err) {
        retries--;
        console.error(
          `❌ Error for brand "${brand.name}" (retries left: ${retries})`,
          err
        );

        // small delay before retry
        await new Promise((r) => setTimeout(r, 1000));
      }
    }
  }

  console.log("🎯 All brand embeddings generated successfully!");
}

generateBrandEmbeddings().catch((err) => {
  console.error("❌ Fatal error running script:", err);
  process.exit(1);
});
