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
