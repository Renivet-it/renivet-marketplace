import { db } from "./src/lib/db";
import { users, userSwapRewards, rewardRedemptions } from "./src/lib/db/schema";
import { swapRewardQueries } from "./src/lib/db/queries/swap-reward";
import { eq, like, desc } from "drizzle-orm";

async function main() {
    console.log("Searching for Ayan's user record...");
    const ayan = await db.query.users.findFirst({
        where: like(users.email, "aya%"),
    });

    if (!ayan) {
        console.error("User not found!");
        process.exit(1);
    }

    const redemption = await swapRewardQueries.getActiveRewardRedemptionForUser(ayan.id);
    if (!redemption) {
        console.error("No active redemption found for user!");
        process.exit(1);
    }

    console.log(`Active Redemption ID: ${redemption.id}`);
    console.log(`Product ID: ${redemption.productId}`);
    console.log(`Variant ID: ${redemption.variantId}`);

    console.log("\nChecking eligibility...");
    const selection = await swapRewardQueries.getEligibleRewardSelection({
        productId: redemption.productId,
        variantId: redemption.variantId ?? undefined,
    });

    console.log("Selection result:", JSON.stringify(selection, null, 2));

    process.exit(0);
}

main().catch(console.error);
