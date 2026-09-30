import { describe, expect, test } from "bun:test";
import { FESTIVE_EDITORIAL_SLIDES } from "./editorial-carousel";

describe("festive editorial carousel", () => {
    test("defines five responsive slides with category destinations", () => {
        expect(FESTIVE_EDITORIAL_SLIDES).toHaveLength(5);

        for (const slide of FESTIVE_EDITORIAL_SLIDES) {
            expect(slide.desktopImage).toMatch(/^https:\/\//);
            expect(slide.mobileImage).toMatch(/^https:\/\//);
            expect(slide.href).toMatch(/^\/festive\?categoryId=/);
            expect(slide.href).not.toContain("undefined");
        }
    });

    test("keeps desktop and mobile artwork distinct for every slide", () => {
        expect(
            FESTIVE_EDITORIAL_SLIDES.every(
                (slide) => slide.desktopImage !== slide.mobileImage
            )
        ).toBe(true);
    });
});
