import { db } from "@/lib/db/index";
import { reasonMasters } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";

const causes = [
    {
        id: "aa6d5e7d-c609-44e4-9a07-146df8f319fe",
        name: "Received wrong item",
        reasonType: "return_reason",
        level: 1,
        shortOrder: 1,
        subCauses: [
            {
                id: "13619428-1b4b-4cba-a950-5c7f51f546a1",
                name: "Received a different product from what was ordered",
                reasonType: "return_reason",
                level: 2,
                shortOrder: 2,
            },
            {
                id: "4831b4b8-70dd-4c69-bae7-f69b067b79bc",
                name: "Received wrong color",
                reasonType: "return_reason",
                level: 2,
                shortOrder: 2,
            },
            {
                id: "2b5eed36-2ba1-4046-a1fa-520e2dd56138",
                name: "Received wrong size",
                reasonType: "return_reason",
                level: 2,
                shortOrder: 2,
            },
            {
                id: "90db03c1-4dcf-428d-a809-1c7a0939014e",
                name: "Received wrong quantity",
                reasonType: "return_reason",
                level: 2,
                shortOrder: 2,
            },
            {
                id: "a42d7ee6-2ffa-433d-98d5-a6f3bd07144e",
                name: "Received someone else’s order",
                reasonType: "return_reason",
                level: 2,
                shortOrder: 2,
            },
        ],
    },
    {
        id: "d531a709-9ce9-4d46-b49a-1513470d6db0",
        name: "Received damaged product",
        reasonType: "return_reason",
        level: 1,
        shortOrder: 1,
        subCauses: [
            {
                id: "4a564954-cf4c-4525-b6c2-865692f37598",
                name: "Product was broken during transit",
                reasonType: "return_reason",
                level: 2,
                shortOrder: 2,
            },
            {
                id: "57733265-80a4-42e2-9ba0-f5551742d857",
                name: "Product seal was broken",
                reasonType: "return_reason",
                level: 2,
                shortOrder: 2,
            },
            {
                id: "02e8f4d7-60d5-41ab-9fe7-d11eda252c6d",
                name: "Packaging was damaged",
                reasonType: "return_reason",
                level: 2,
                shortOrder: 2,
            },
            {
                id: "2203ecf0-54ce-4702-a887-6f27080f404f",
                name: "Product is leaking or has physical damage",
                reasonType: "return_reason",
                level: 2,
                shortOrder: 2,
            },
            {
                id: "d2e2da6b-917b-4b0b-83c8-3dd1e283faca",
                name: "Accessory/part missing or broken",
                reasonType: "return_reason",
                level: 2,
                shortOrder: 2,
            },
        ],
    },
    {
        id: "83b13631-631e-4085-b931-75ccaeee386b",
        name: "Size/fit issue",
        reasonType: "return_reason",
        level: 1,
        shortOrder: 1,
        subCauses: [
            {
                id: "7ce42ba3-09bc-434f-8991-9cf04b6b0a1d",
                name: "Product is too small",
                reasonType: "return_reason",
                level: 2,
                shortOrder: 2,
            },
            {
                id: "9b225fca-01d0-47a0-ba4c-e4dac26fb58b",
                name: "Product is too large",
                reasonType: "return_reason",
                level: 2,
                shortOrder: 2,
            },
            {
                id: "3be596d7-0878-41a0-a983-828784c2724e",
                name: "Product size doesn’t match the size chart",
                reasonType: "return_reason",
                level: 2,
                shortOrder: 2,
            },
            {
                id: "acf4cb8f-e8b3-42de-b9e8-0cfe62e73c11",
                name: "Wrong size sent",
                reasonType: "return_reason",
                level: 2,
                shortOrder: 2,
            },
            {
                id: "1c49ee09-4153-41cf-ba17-cb10d07a793b",
                name: "Tight/uncomfortable fit",
                reasonType: "return_reason",
                level: 2,
                shortOrder: 2,
            },
        ],
    },
    {
        id: "f439de0a-ec60-4618-a35e-23045e221822",
        name: "Quality not as expected",
        reasonType: "return_reason",
        level: 1,
        shortOrder: 1,
        subCauses: [
            {
                id: "210ab6e5-25ba-48ef-b0fb-01bb67c66207",
                name: "Material feels cheap or different",
                reasonType: "return_reason",
                level: 2,
                shortOrder: 2,
            },
            {
                id: "28ed7a47-6334-4ab6-8d2c-0660ea17920d",
                name: "Color faded or different from display",
                reasonType: "return_reason",
                level: 2,
                shortOrder: 2,
            },
            {
                id: "feb708c4-a965-4509-896c-6ba2bcb70a89",
                name: "Product feels used or refurbished",
                reasonType: "return_reason",
                level: 2,
                shortOrder: 2,
            },
            {
                id: "9ebcaf7f-fe88-46b2-b5b1-2ac29677f6fe",
                name: "Stitching or finish is poor",
                reasonType: "return_reason",
                level: 2,
                shortOrder: 2,
            },
            {
                id: "c7b8d47e-582c-4e7c-8017-6e4e715e9f70",
                name: "Performance/functionality issue",
                reasonType: "return_reason",
                level: 2,
                shortOrder: 2,
            },
        ],
    },
    {
        id: "b07d2b1a-b7a4-4d08-9f84-4791d75a8b4d",
        name: "Other",
        reasonType: "return_reason",
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
                    eq(reasonMasters.reasonType, "return_reason")
                )
            );

        // Then delete level 1 parent causes
        await tx
            .delete(reasonMasters)
            .where(
                and(
                    eq(reasonMasters.level, 1),
                    eq(reasonMasters.reasonType, "return_reason")
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
