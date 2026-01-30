import { db } from "@/lib/db";
import { products } from "@/lib/db/schema";
import { getEmbedding } from "@/lib/python/sematic-search";
import { eq } from "drizzle-orm";

async function main() {
    console.log("Starting semantic search embedding generation...");

    // 1. Fetch all products with necessary relations
    const allProducts = await db.query.products.findMany({
        with: {
            brand: true,
            category: true,
            subcategory: true,
            productType: true,
        },
    });

    console.log(`Found ${allProducts.length} products to process.`);

    let successCount = 0;
    let errorCount = 0;

    for (const product of allProducts) {
        try {
            // 2. Construct the text for embedding
            // Format: [Title] [Description] [Meta Keywords] [Category] [SubCategory] [ProductType] [Brand]
            const parts = [
                product.title || "",
                product.description || "",
                product.metaKeywords?.join(", ") || "",
                product.category?.name || "",
                product.subcategory?.name || "",
                product.productType?.name || "",
                product.brand?.name || "",
            ];

            // Filter out empty strings and join
            const embeddingText = parts
                .filter((p) => p && p.trim() !== "")
                .join(" ");

            if (!embeddingText) {
                console.warn(
                    `Skipping product ${product.id} (${product.title}): No metadata available for embedding.`
                );
                continue;
            }

            console.log(`Processing product: ${product.title}`);

            // 3. Generate embedding
            const embedding = await getEmbedding(embeddingText);

            // 4. Update the product in the database
            await db
                .update(products)
                .set({
                    semanticSearchEmbeddings: embedding,
                })
                .where(eq(products.id, product.id));

            successCount++;
        } catch (error) {
            console.error(
                `Failed to process product ${product.id} (${product.title}):`,
                error
            );
            errorCount++;
        }
    }

    console.log("\n--- Summary ---");
    console.log(`Total Products: ${allProducts.length}`);
    console.log(`Successfully Updated: ${successCount}`);
    console.log(`Errors: ${errorCount}`);
    console.log("Done.");
    process.exit(0);
}

main().catch((err) => {
    console.error("Script failed:", err);
    process.exit(1);
});
