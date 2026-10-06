import { expect, test } from "bun:test";

const files = {
    trpc: "../lib/trpc/trpc.ts",
    brands: "../lib/trpc/routes/brands/brands.ts",
    roles: "../lib/trpc/routes/brands/roles.ts",
    members: "../lib/trpc/routes/brands/members.ts",
    analytics: "../lib/trpc/routes/brands/analytics.ts",
    orders: "../lib/trpc/routes/brands/orders.ts",
    products: "../lib/trpc/routes/brands/products.ts",
    pages: "../lib/trpc/routes/brands/brand-pages.ts",
    invites: "../lib/trpc/routes/brands/invites.ts",
    bans: "../lib/trpc/routes/brands/bans.ts",
} as const;

async function read(path: string) {
    return Bun.file(new URL(path, import.meta.url)).text();
}

test("REN-172 uses one shared direct-brand guard with an admin bypass and alert", async () => {
    const source = await read(files.trpc);

    expect(source).toContain("permType === \"brand\"");
    expect(source).toContain("requireOwnBrand(ctx, targetBrandId");
    expect(source).toContain('type: "cross_brand_rejection"');
    expect(source).toContain("cross_brand_rejection:${procedureName}");
    expect(source).toContain("isSiteAdmin || ctx.user.brand?.id === targetBrandId");
});

test("REN-172 protects all direct and resolved target-brand surfaces", async () => {
    const source = await Promise.all(Object.values(files).map(read));
    const combined = source.join("\n");

    for (const name of [
        "getUnicommerceIntegration",
        "upsertUnicommerceIntegration",
        "authenticateUnicommerceIntegration",
        "runUnicommerceApiRequest",
        "testUnicommerceIntegration",
        "triggerUnicommerceSync",
        "changeBrandSubscription",
        "cancelBrandSubscription",
        "roles.getRoles",
        "roles.reorderRoles",
        "members.roles.updateRoles",
        "analytics.getOverview",
        "analytics.getMonthlySales",
        "analytics.getStatusBreakdown",
        "analytics.getTopProducts",
        "orders.getOrderShipmentDetailsByShipmentId",
        "brandPages.createBrandPageSectionProduct",
        "brandPages.updateBrandPageSectionProduct",
        "brandPages.deleteBrandPageSectionProduct",
        "brandPages.createBrandPageSection",
        "brandPages.updateBrandPageSection",
        "brandPages.deleteBrandPageSection",
        "invites.getInvites",
        "invites.getInvite",
        "bans.getBannedMembers",
        "products.updateProductPublishStatus",
        "products.updateCatalogQcReview",
        "products.createProductJourney",
        "products.updateProductJourney",
        "products.createProductValue",
        "products.updateProductValue",
    ]) {
        expect(combined).toContain(name);
    }

    expect(combined.match(/requireOwnBrand\(/g)?.length).toBeGreaterThanOrEqual(28);
});
