import { expect, test } from "bun:test";
import { BitFieldSitePermission } from "./permissions";
import { generalSidebarConfig } from "./site";

test("shows the external side-effects control under Platform Settings", () => {
    const platformSettings = generalSidebarConfig.find(
        (section) => section.title === "Platform Settings"
    );

    expect(platformSettings?.items).toContainEqual({
        title: "External Side Effects",
        url: "/dashboard/general/settings/external-side-effects",
        permissions:
            BitFieldSitePermission.MANAGE_SETTINGS |
            BitFieldSitePermission.ADMINISTRATOR,
    });
});

test("shows the product HSN import under Platform Settings", () => {
    const platformSettings = generalSidebarConfig.find(
        (section) => section.title === "Platform Settings"
    );

    expect(platformSettings?.items).toContainEqual({
        title: "Product HSN Import",
        url: "/dashboard/general/settings/product-hsn-import",
        permissions:
            BitFieldSitePermission.MANAGE_SETTINGS |
            BitFieldSitePermission.ADMINISTRATOR,
    });
});

test("shows legacy product slug migration under Platform Settings", () => {
    const platformSettings = generalSidebarConfig.find(
        (section) => section.title === "Platform Settings"
    );

    expect(platformSettings?.items).toContainEqual({
        title: "Legacy Product Slug Migration",
        url: "/dashboard/general/settings/product-slug-migration",
        permissions:
            BitFieldSitePermission.MANAGE_SETTINGS |
            BitFieldSitePermission.ADMINISTRATOR,
    });
});
