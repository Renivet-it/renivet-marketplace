import { and, eq } from "drizzle-orm";
import { db } from "../lib/db";
import { products, productVariants } from "../lib/db/schema";

async function main() {
    console.log("Searching for 'The Minimalist Shirt'...");

    const product = await db.query.products.findFirst({
        where: eq(products.title, "The Minimalist Shirt"),
        with: {
            variants: true,
        },
    });

    if (!product) {
        console.log("Product not found!");
        return;
    }

    console.log("Product Found:", product.title);
    console.log("ID:", product.id);
    console.log("Price:", product.price);
    console.log("Compare At Price:", product.compareAtPrice);
    console.log("Has Variants Flag:", product.productHasVariants);
    console.log("Is Deleted:", product.isDeleted);
    console.log("Verification Status:", product.verificationStatus);

    console.log("\nVariants:");
    if (product.variants.length === 0) {
        console.log("No variants found.");
    } else {
        product.variants.forEach((v) => {
            console.log(
                `- ID: ${v.id}, SKU: ${v.sku}, Price: ${v.price}, Is Deleted: ${v.isDeleted}, Quantity: ${v.quantity}`
            );
        });
    }

    // Manual query to check what the SQL would return
    const manualVariants = await db
        .select()
        .from(productVariants)
        .where(
            and(
                eq(productVariants.productId, product.id),
                eq(productVariants.isDeleted, false)
            )
        );

    console.log("\nManual Active Variants Query Count:", manualVariants.length);
    manualVariants.forEach((v) => {
        console.log(`- ID: ${v.id}, Price: ${v.price}`);
    });

    process.exit(0);
}

main().catch(console.error);
