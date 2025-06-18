import { db } from "@/lib/db/index";
import { reasonMasters } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";

const causes = [
    {
        id: "a52259ca-f762-492f-be5e-36c0a68075ef",
        name: "Received wrong item",
        reasonType: "exchange_reason",
        level: 1,
        shortOrder: 1,
        subCauses: [
            {
                id: "46eec351-719b-4d32-bcd7-5a82bebcdf15",
                name: "Received a different product from what was ordered",
                reasonType: "exchange_reason",
                level: 2,
                shortOrder: 2,
            },
            {
                id: "d5f5b1bf-2bde-47cb-95c0-2ef497bb8066",
                name: "Received wrong color",
                reasonType: "exchange_reason",
                level: 2,
                shortOrder: 2,
            },
            {
                id: "d6d040dd-507e-4417-bbfc-63ad21e02283",
                name: "Received wrong size",
                reasonType: "exchange_reason",
                level: 2,
                shortOrder: 2,
            },
            {
                id: "00d07950-6c43-42bf-87cf-bee553620fc7",
                name: "Received wrong quantity",
                reasonType: "exchange_reason",
                level: 2,
                shortOrder: 2,
            },
            {
                id: "3645ff52-69b2-4199-ab7b-a231d9a31fb1",
                name: "Received someone else’s order",
                reasonType: "exchange_reason",
                level: 2,
                shortOrder: 2,
            },
        ],
    },
    {
        id: "576453de-c48a-4f9d-8ba3-f108e322c4c5",
        name: "Received damaged product",
        reasonType: "exchange_reason",
        level: 1,
        shortOrder: 1,
        subCauses: [
            {
                id: "3a40d9d3-fe24-4377-be6a-753227a77010",
                name: "Product was broken during transit",
                reasonType: "exchange_reason",
                level: 2,
                shortOrder: 2,
            },
            {
                id: "9a34aa9d-f8aa-46b5-b2e9-49ae81201e70",
                name: "Product seal was broken",
                reasonType: "exchange_reason",
                level: 2,
                shortOrder: 2,
            },
            {
                id: "796a8467-1226-4efb-8956-936371852648",
                name: "Packaging was damaged",
                reasonType: "exchange_reason",
                level: 2,
                shortOrder: 2,
            },
            {
                id: "75a7a1b2-ba91-4941-9814-c73d0d78ebf2",
                name: "Product is leaking or has physical damage",
                reasonType: "exchange_reason",
                level: 2,
                shortOrder: 2,
            },
            {
                id: "99ec54ac-938c-4ef4-829c-59b6dd096e8e",
                name: "Accessory/part missing or broken",
                reasonType: "exchange_reason",
                level: 2,
                shortOrder: 2,
            },
        ],
    },
    {
        id: "edd79fb7-230b-4ca3-9dad-ac1959da5b72",
        name: "Size/fit issue",
        reasonType: "exchange_reason",
        level: 1,
        shortOrder: 1,
        subCauses: [
            {
                id: "70d484a6-d8da-4680-b5fe-f6d8ae2ae30f",
                name: "Product is too small",
                reasonType: "exchange_reason",
                level: 2,
                shortOrder: 2,
            },
            {
                id: "d5cf0a10-2766-4158-8422-cac0eac08ec8",
                name: "Product is too large",
                reasonType: "exchange_reason",
                level: 2,
                shortOrder: 2,
            },
            {
                id: "f40d181c-a4c1-4ead-a40b-335bb692f1f4",
                name: "Product size doesn’t match the size chart",
                reasonType: "exchange_reason",
                level: 2,
                shortOrder: 2,
            },
            {
                id: "2bf8707c-1193-45bd-9dda-9a87891364be",
                name: "Wrong size sent",
                reasonType: "exchange_reason",
                level: 2,
                shortOrder: 2,
            },
            {
                id: "4dc88e43-1b4d-46b5-95e2-e0cba62e934a",
                name: "Tight/uncomfortable fit",
                reasonType: "exchange_reason",
                level: 2,
                shortOrder: 2,
            },
        ],
    },
    {
        id: "10beece2-3f7b-4218-922a-ca4fa38a8886",
        name: "Quality not as expected",
        reasonType: "exchange_reason",
        level: 1,
        shortOrder: 1,
        subCauses: [
            {
                id: "b9e9da93-5960-4b0c-9fad-626997017884",
                name: "Material feels cheap or different",
                reasonType: "exchange_reason",
                level: 2,
                shortOrder: 2,
            },
            {
                id: "12c34f62-fb4e-48cd-b791-5a780c22d7b0",
                name: "Color faded or different from display",
                reasonType: "exchange_reason",
                level: 2,
                shortOrder: 2,
            },
            {
                id: "be21dc84-0ba9-4fd4-9de9-8c7e67bf930d",
                name: "Product feels used or refurbished",
                reasonType: "exchange_reason",
                level: 2,
                shortOrder: 2,
            },
            {
                id: "b54c460e-5a6a-4d34-aab7-8b25370d24ac",
                name: "Stitching or finish is poor",
                reasonType: "exchange_reason",
                level: 2,
                shortOrder: 2,
            },
            {
                id: "fa6f81cf-8625-4f5c-97d2-cc03f9856c33",
                name: "Performance/functionality issue",
                reasonType: "exchange_reason",
                level: 2,
                shortOrder: 2,
            },
        ],
    },
    {
        id: "8305b721-ddd8-43f6-9f26-b4accff0103d",
        name: "Other",
        reasonType: "exchange_reason",
        level: 1,
        shortOrder: 1,
        subCauses: [],
    },
];

export async function seedReasons() {
    await db.transaction(async (tx) => {
        // Delete level 2 sub-causes first
        await tx
            .delete(reasonMasters)
            .where(
                and(
                    eq(reasonMasters.level, 2),
                    eq(reasonMasters.reasonType, "exchange_reason")
                )
            );

        // Then delete level 1 parent causes
        await tx
            .delete(reasonMasters)
            .where(
                and(
                    eq(reasonMasters.level, 1),
                    eq(reasonMasters.reasonType, "exchange_reason")
                )
            );

        // Insert parent causes and their sub-causes
        for (const cause of causes) {
            await tx.insert(reasonMasters).values({
                id: cause.id,
                name: cause.name,
                reasonType: cause.reasonType,
                level: cause.level,
                shortOrder: cause.shortOrder,
            });

            for (const sub of cause.subCauses) {
                await tx.insert(reasonMasters).values({
                    id: sub.id,
                    name: sub.name,
                    reasonType: sub.reasonType,
                    level: sub.level,
                    shortOrder: sub.shortOrder,
                    parentId: cause.id,
                });
            }
        }
    });

    console.log("✅ Seeded all reason masters in a transaction!");
}

async function main() {
    await seedReasons();
    process.exit(0);
}

main().catch((e) => {
    console.error("❌ Seeding failed", e);
    process.exit(1);
});
