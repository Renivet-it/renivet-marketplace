import { describe, expect, test } from "bun:test";
import { buildCategoryOverview } from "./category-overview-panel";

describe("buildCategoryOverview", () => {
    test("creates a useful category panel from the current category and subcategories", () => {
        const overview = buildCategoryOverview({
            category: { id: "women", name: "Women", slug: "women" },
            subCategories: [
                { id: "western", name: "Western Wear", categoryId: "women" },
                { id: "duplicate", name: "Western Wear", categoryId: "women" },
                { id: "home", name: "Home", categoryId: "home" },
            ],
        });

        expect(overview.title).toBe("Explore Women");
        expect(overview.links).toEqual([
            {
                id: "western",
                label: "Western Wear",
                href: "/shop/women?subCategoryId=western",
            },
        ]);
    });
});
