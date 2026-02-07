/**
 * Test script for Recommendation Engine
 *
 * Run with: bun src/scripts/test-recommendation-logic.ts
 */

import { db } from "@/lib/db";
import {
    orders,
    productEvents,
    products,
    searchAnalytics,
    wishlists,
} from "@/lib/db/schema";
import { getRecommendations, getSimilarProducts } from "@/lib/recommendations";
import { desc, eq } from "drizzle-orm";

async function main() {
    console.log("🧪 Testing Recommendation Engine\n");
    console.log("=".repeat(60));

    // Test Case 1: Find a user with orders
    console.log("\n📦 Test Case 1: User with Orders");
    console.log("-".repeat(40));

    const userWithOrders = await db
        .select({ userId: orders.userId })
        .from(orders)
        .where(eq(orders.paymentStatus, "paid"))
        .limit(1)
        .then((res) => res[0]);

    if (userWithOrders) {
        console.log(`Found user with orders: ${userWithOrders.userId}`);
        const result = await getRecommendations(userWithOrders.userId, 5);
        console.log(`Signal used: ${result.signalUsed}`);
        console.log(`Products returned: ${result.products.length}`);
        console.log(`Debug info:`, result.debug);
        if (result.products.length > 0) {
            console.log(
                `Sample product: "${result.products[0].title}" by ${result.products[0].brand?.name}`
            );
        }
    } else {
        console.log("No users with orders found");
    }

    // Test Case 2: Find a user with wishlist (no orders)
    console.log("\n❤️ Test Case 2: User with Wishlist");
    console.log("-".repeat(40));

    const userWithWishlist = await db
        .select({ userId: wishlists.userId })
        .from(wishlists)
        .limit(1)
        .then((res) => res[0]);

    if (userWithWishlist) {
        console.log(`Found user with wishlist: ${userWithWishlist.userId}`);
        const result = await getRecommendations(userWithWishlist.userId, 5);
        console.log(`Signal used: ${result.signalUsed}`);
        console.log(`Products returned: ${result.products.length}`);
        console.log(`Debug info:`, result.debug);
        if (result.products.length > 0) {
            console.log(
                `Sample product: "${result.products[0].title}" by ${result.products[0].brand?.name}`
            );
        }
    } else {
        console.log("No users with wishlist found");
    }

    // Test Case 3: Find a user with product views
    console.log("\n👁️ Test Case 3: User with Product Views");
    console.log("-".repeat(40));

    const userWithViews = await db
        .select({ userId: productEvents.userId })
        .from(productEvents)
        .where(eq(productEvents.event, "view"))
        .limit(1)
        .then((res) => res[0]);

    if (userWithViews?.userId) {
        console.log(`Found user with views: ${userWithViews.userId}`);
        const result = await getRecommendations(userWithViews.userId, 5);
        console.log(`Signal used: ${result.signalUsed}`);
        console.log(`Products returned: ${result.products.length}`);
        console.log(`Debug info:`, result.debug);
        if (result.products.length > 0) {
            console.log(
                `Sample product: "${result.products[0].title}" by ${result.products[0].brand?.name}`
            );
        }
    } else {
        console.log("No users with product views found");
    }

    // Test Case 4: Find a user with search history
    console.log("\n🔍 Test Case 4: User with Search History");
    console.log("-".repeat(40));

    const userWithSearches = await db
        .select({ userId: searchAnalytics.userId })
        .from(searchAnalytics)
        .where(eq(searchAnalytics.intentType, "BRAND"))
        .limit(1)
        .then((res) => res[0]);

    if (userWithSearches?.userId) {
        console.log(`Found user with searches: ${userWithSearches.userId}`);
        const result = await getRecommendations(userWithSearches.userId, 5);
        console.log(`Signal used: ${result.signalUsed}`);
        console.log(`Products returned: ${result.products.length}`);
        console.log(`Debug info:`, result.debug);
        if (result.products.length > 0) {
            console.log(
                `Sample product: "${result.products[0].title}" by ${result.products[0].brand?.name}`
            );
        }
    } else {
        console.log("No users with search history found");
    }

    // Test Case 5: Anonymous user (null userId)
    console.log("\n👤 Test Case 5: Anonymous User (Default)");
    console.log("-".repeat(40));

    const anonResult = await getRecommendations(null, 5);
    console.log(`Signal used: ${anonResult.signalUsed}`);
    console.log(`Products returned: ${anonResult.products.length}`);
    if (anonResult.products.length > 0) {
        console.log(
            `Sample product: "${anonResult.products[0].title}" by ${anonResult.products[0].brand?.name}`
        );
    }

    // Test Case 6: Similar Products
    console.log("\n🔗 Test Case 6: Similar Products");
    console.log("-".repeat(40));

    const sampleProduct = await db
        .select({ id: products.id, title: products.title })
        .from(products)
        .where(eq(products.isPublished, true))
        .limit(1)
        .then((res) => res[0]);

    if (sampleProduct) {
        console.log(`Source product: "${sampleProduct.title}"`);
        const similar = await getSimilarProducts(sampleProduct.id, 5);
        console.log(`Similar products found: ${similar.length}`);
        similar.forEach((p, i) => {
            console.log(`  ${i + 1}. "${p.title}" by ${p.brand?.name}`);
        });
    } else {
        console.log("No products found");
    }

    console.log("\n" + "=".repeat(60));
    console.log("✅ Test complete!\n");

    process.exit(0);
}

main().catch((err) => {
    console.error("Test failed:", err);
    process.exit(1);
});
