import { db } from "@/lib/db";
import { products } from "@/lib/db/schema";
import { getEmbedding768 } from "@/lib/python/sematic-search";
import { eq, isNull } from "drizzle-orm";

/**
 * Generate 768-dim semantic search embeddings for all products
 * Uses the E5-base-v2 model for high-quality semantic understanding
 *
 * Run with: bun run generate-embeddings.ts
 */
async function generateAdvancedEmbeddings() {
    const forceRegenerate = process.argv.includes("--force");

    console.log(
        "🚀 Starting advanced embedding generation (768-dim E5 model)..."
    );
    if (forceRegenerate) {
        console.log("⚠️ FORCE REGENERATE MODE: Updating all products\n");
    } else {
        console.log(
            "ℹ️ NORMAL MODE: Only updating products with missing embeddings (use --force to update all)\n"
        );
    }

    const allProducts = await db.query.products.findMany({
        where: forceRegenerate
            ? undefined
            : isNull(products.semanticSearchEmbeddings),
        columns: {
            id: true,
            title: true,
            description: true,
            sizeAndFit: true,
            materialAndCare: true,
            metaDescription: true,
            metaTitle: true,
            metaKeywords: true,
        },
        with: {
            brand: {
                columns: { name: true },
            },
            category: {
                columns: { name: true },
            },
            subcategory: {
                columns: { name: true },
            },
            productType: {
                columns: { name: true },
            },
            specifications: {
                columns: {
                    key: true,
                    value: true,
                },
            },
        },
    });

    console.log(`📦 Found ${allProducts.length} products to process\n`);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < allProducts.length; i++) {
        const product = allProducts[i];

        // Combine specifications as "key:value" pairs
        const specsText = product.specifications
            .map((spec) => `${spec.key}:${spec.value}`)
            .join(" ");

        // Combine meta keywords
        const keywordsText = product.metaKeywords?.join(" ") || "";

        // Build comprehensive text representation for embedding
        // Including all relevant searchable fields
        const text = [
            product.title, // Primary search target
            product.brand?.name || "", // Brand matching
            product.category?.name || "", // Category context
            product.subcategory?.name || "", // Subcategory context
            product.productType?.name || "", // Product type
            product.description || "", // Full description
            product.metaDescription || "", // SEO description
            product.metaTitle || "", // SEO title
            keywordsText, // Meta keywords
            product.sizeAndFit || "", // Size info
            product.materialAndCare || "", // Material info
            specsText, // Specifications
        ]
            .filter(Boolean)
            .join(" ")
            .trim();

        if (!text) {
            console.log(`⚠️ Skipping product ${product.id} - no text content`);
            await db
                .update(products)
                .set({ semanticSearchEmbeddings: null })
                .where(eq(products.id, product.id));
            continue;
        }

        try {
            // Generate 768-dim embedding using E5 model
            const embeddingArray = await getEmbedding768(text);

            if (
                !Array.isArray(embeddingArray) ||
                embeddingArray.length !== 768
            ) {
                console.error(`❌ Invalid embedding for product ${product.id}`);
                errorCount++;
                continue;
            }

            // Update the semanticSearchEmbeddings column
            await db
                .update(products)
                .set({ semanticSearchEmbeddings: embeddingArray })
                .where(eq(products.id, product.id));

            successCount++;

            // Progress logging every 10 products
            if ((i + 1) % 10 === 0 || i === allProducts.length - 1) {
                console.log(
                    `✅ Progress: ${i + 1}/${allProducts.length} products processed`
                );
            }
        } catch (error) {
            console.error(
                `❌ Error generating embedding for product ${product.id}:`,
                error instanceof Error ? error.message : String(error)
            );
            errorCount++;
        }
    }

    console.log("\n" + "=".repeat(50));
    console.log("📊 SUMMARY");
    console.log("=".repeat(50));
    console.log(`✅ Successfully processed: ${successCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log(`📦 Total products: ${allProducts.length}`);
    console.log("=".repeat(50));
}

generateAdvancedEmbeddings()
    .then(() => {
        console.log("\n🎉 Advanced embeddings generation complete!");
        process.exit(0);
    })
    .catch((error) => {
        console.error("💥 Fatal error:", error);
        process.exit(1);
    });
