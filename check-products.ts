import { eq, sql } from "drizzle-orm";
import { db } from "./src/lib/db";
import { products } from "./src/lib/db/schema/product";

async function check() {
    try {
        const allProducts = await db
            .select({ count: sql<number>`count(*)` })
            .from(products);
        const bestSellers = await db
            .select({ count: sql<number>`count(*)` })
            .from(products)
            .where(eq(products.isBestSeller, true));

        console.log(`Total products: ${JSON.stringify(allProducts)}`);
        console.log(`Best sellers: ${JSON.stringify(bestSellers)}`);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

check();
