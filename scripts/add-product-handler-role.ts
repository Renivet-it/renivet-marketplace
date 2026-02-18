import { BitFieldSitePermission } from "@/config/permissions";
import { db } from "@/lib/db";
import { roles } from "@/lib/db/schema";
import { generateId } from "@/lib/utils";
import { eq } from "drizzle-orm";

async function main() {
    console.log("Adding Product Handler role...");

    const roleName = "Product Handler";
    const roleSlug = "product-handler";

    // View Products + View Categories + View Protected Pages (for dashboard access)
    // VIEW_PROTECTED_PAGES is usually required for any dashboard access
    const permissions =
        BitFieldSitePermission.VIEW_PRODUCTS |
        BitFieldSitePermission.VIEW_CATEGORIES |
        BitFieldSitePermission.VIEW_PROTECTED_PAGES |
        BitFieldSitePermission.MANAGE_PRODUCTS;

    const existingRole = await db.query.roles.findFirst({
        where: eq(roles.slug, roleSlug),
    });

    if (existingRole) {
        console.log("Role already exists, updating permissions...");
        await db
            .update(roles)
            .set({
                sitePermissions: permissions.toString(),
                brandPermissions: "0", // Site role usually doesn't have brand permissions unless dual-purpose
                updatedAt: new Date(),
            })
            .where(eq(roles.id, existingRole.id));
        console.log("Role updated successfully.");
    } else {
        console.log("Creating new role...");
        await db.insert(roles).values({
            name: roleName,
            slug: roleSlug,
            position: 0,
            sitePermissions: permissions.toString(),
            brandPermissions: "0",
            isSiteRole: true,
            createdAt: new Date(),
            updatedAt: new Date(),
        });
        console.log("Role created successfully.");
    }
}

main()
    .then(() => {
        console.log("Done");
        process.exit(0);
    })
    .catch((err) => {
        console.error("Error:", err);
        process.exit(1);
    });
