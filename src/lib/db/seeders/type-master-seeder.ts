import { db } from "@/lib/db/index";
import { typeMasters } from "@/lib/db/schema";
import { eq, or } from "drizzle-orm";

const types = [
    {
        id: "f73d90ba-586b-4da4-bd8f-98f715e9818f",
        code: "return_reason",
        name: "Return Reason",
    },
    {
        id: "bfffb571-abc4-44b5-885d-152ec7acb5a4",
        code: "exchange_reason",
        name: "Return Reason",
    },
];

export async function seedReasons() {
    await db.transaction(async (tx) => {
        // Delete level 2 sub-causes first
        await tx
            .delete(typeMasters)
            .where(
                or(
                    eq(typeMasters.code, "return_reason"),
                    eq(typeMasters.code, "exchange_reason")
                )
            );

        // Insert parent causes and their sub-causes
        for (const type of types) {
            await tx.insert(typeMasters).values({
                id: type.id,
                name: type.name,
                code: type.code,
            });
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
