import "dotenv/config";

import { marketingQueries } from "../src/lib/db/queries/marketing";

async function main() {
    const rows = [
        {
            partnerName: "Eco Creator Collab",
            campaignType: "Instagram Reel",
            plannedDate: new Date("2026-07-20T10:00:00.000Z"),
            liveDate: null,
            goal: "Drive first-time purchases",
            couponCode: "ECOCREATOR10",
            trackingUrl:
                "https://renivet.com/shop?utm_source=partner&utm_medium=creator&utm_campaign=eco_creator_collab",
            notes: "Test partnership entry for admin tracking.",
            status: "planned" as const,
            metadata: {},
        },
        {
            partnerName: "Sustainable Stylist Edit",
            campaignType: "Instagram Story",
            plannedDate: new Date("2026-07-18T10:00:00.000Z"),
            liveDate: new Date("2026-07-19T10:00:00.000Z"),
            goal: "Drive landing-page visits",
            couponCode: "STYLIST08",
            trackingUrl:
                "https://renivet.com/shop?utm_source=partner&utm_medium=story&utm_campaign=sustainable_stylist_edit",
            notes: "Short-term story push for summer picks.",
            status: "live" as const,
            metadata: {},
        },
        {
            partnerName: "Green Circle Newsletter",
            campaignType: "Newsletter Feature",
            plannedDate: new Date("2026-07-10T10:00:00.000Z"),
            liveDate: new Date("2026-07-12T10:00:00.000Z"),
            goal: "Promote curated conscious products",
            couponCode: "GREENCIRCLE12",
            trackingUrl:
                "https://renivet.com/shop?utm_source=partner&utm_medium=newsletter&utm_campaign=green_circle_feature",
            notes: "Completed test row for reporting visibility.",
            status: "completed" as const,
            metadata: {},
        },
    ];

    for (const row of rows) {
        await marketingQueries.createPartnership(row);
    }

    console.log(`Inserted ${rows.length} marketing partnership test rows.`);
    process.exit(0);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
