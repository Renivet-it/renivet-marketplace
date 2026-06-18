import "dotenv/config";

import { swapRewardService } from "@/lib/services/swap-reward";

function parseArgs(argv: string[]) {
    let userId: string | undefined;
    let dryRun = false;

    for (const arg of argv) {
        if (arg === "--dry-run") {
            dryRun = true;
            continue;
        }

        if (arg.startsWith("--userId=")) {
            userId = arg.slice("--userId=".length).trim() || undefined;
        }
    }

    return {
        userId,
        dryRun,
    };
}

async function main() {
    const options = parseArgs(process.argv.slice(2));

    console.log(
        `Starting Swap & Reward historical backfill${options.dryRun ? " (dry run)" : ""}...`
    );

    if (options.userId) {
        console.log(`Target user: ${options.userId}`);
    }

    const summary = await swapRewardService.backfillHistoricalRewards(options);

    console.log("Backfill summary:");
    console.log(`- Dry run: ${summary.dryRun ? "yes" : "no"}`);
    console.log(`- Processed users: ${summary.processedUsers}`);
    console.log(`- Skipped users: ${summary.skippedUsers}`);
    console.log(`- Processed orders: ${summary.processedOrders}`);
    console.log(`- Stamp earned events rebuilt: ${summary.totalStampedOrders}`);
    console.log(`- Stamp revoked events rebuilt: ${summary.totalRevokedOrders}`);
    console.log(`- Users currently unlocked: ${summary.unlockedUsers}`);

    if (summary.skippedUserIds.length > 0) {
        console.log(
            `- Skipped user IDs with completed reward redemptions: ${summary.skippedUserIds.join(", ")}`
        );
    }
}

main()
    .then(() => {
        process.exit(0);
    })
    .catch((error) => {
        if (
            typeof error === "object" &&
            error !== null &&
            "code" in error &&
            error.code === "42703"
        ) {
            console.error(
                "Swap reward backfill failed because the loyalty migration is not applied yet. Run the new DB migration first, then rerun this command."
            );
            process.exit(1);
        }

        console.error("Swap reward backfill failed:", error);
        process.exit(1);
    });
