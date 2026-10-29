import { expect, test } from "bun:test";
import { createBannerSchema } from "../src/lib/validations/banner";

test("banner records default to desktop placement and allow mobile placement", () => {
    const common = {
        title: "Homepage slide",
        description: "Campaign banner",
        imageUrl: "https://example.com/banner.jpg",
        url: "/shop",
        isActive: true,
    };

    expect(createBannerSchema.parse(common).isMobile).toBe(false);
    expect(
        createBannerSchema.parse({ ...common, isMobile: true }).isMobile
    ).toBe(true);
});
