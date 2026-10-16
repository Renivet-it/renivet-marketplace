import { readFileSync } from "node:fs";
import { expect, test } from "bun:test";
import {
    BOTANICAL_BANNER_COPY,
    BOTANICAL_DESKTOP_IMAGE,
    BOTANICAL_DESKTOP_LAYOUT,
    BOTANICAL_MOBILE_IMAGE,
} from "./botanical-banner";

test("botanical banner uses the approved responsive artwork", () => {
    expect(BOTANICAL_MOBILE_IMAGE).toBe(
        "/assets/botanical-banner/botanical-mobile.png"
    );
    expect(BOTANICAL_DESKTOP_IMAGE).toBe(
        "/assets/botanical-banner/botanical-desktop.png"
    );
    expect(BOTANICAL_BANNER_COPY.heading).toBe(
        "Meet the brands changing the way we shop."
    );
});

test("botanical banner uses the approved desktop frame and fills both halves", () => {
    expect(BOTANICAL_DESKTOP_LAYOUT).toEqual({
        fullWidth: true,
        height: 324,
        columns: "1fr 1fr",
    });
});

test("botanical banner appears directly below featured brands", () => {
    const page = readFileSync("src/app/(home)/page.tsx", "utf8");
    const brandsPosition = page.indexOf("<FeaturedBrandsFetch />");
    const botanicalPosition = page.indexOf("<BotanicalBannerFetch />");

    expect(brandsPosition).toBeGreaterThan(-1);
    expect(botanicalPosition).toBeGreaterThan(brandsPosition);
    expect(page).not.toContain("<ProductsUnder999Fetch />");
});
