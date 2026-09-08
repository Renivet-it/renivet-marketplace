import { describe, expect, test } from "bun:test";
import { applySearchFailure, applySearchSuccess } from "./search-navigation";

describe("REN-149 successful search navigation", () => {
    test.each([
        "/brands/known-brand",
        "/shop?categoryId=category-1",
        "/shop?subcategoryId=subcategory-1",
        "/shop?productTypeId=product-type-1",
        "/shop?search=free%20text",
    ])("uses the server redirect exactly once: %s", (redirectUrl) => {
        const uiUpdates: string[] = [];
        const navigations: string[] = [];

        applySearchSuccess(
            { redirectUrl },
            {
                closeSuggestions: () => uiUpdates.push("suggestions-closed"),
                closeSheet: () => uiUpdates.push("sheet-closed"),
                navigate: (destination) => navigations.push(destination),
            }
        );

        expect(uiUpdates).toEqual(["suggestions-closed", "sheet-closed"]);
        expect(navigations).toEqual([redirectUrl]);
    });
});

describe("REN-149 failed search navigation", () => {
    test("closes the sheet and falls back to the submitted query once", () => {
        const uiUpdates: string[] = [];
        const fallbackQueries: string[] = [];

        applySearchFailure(
            { query: "unclassified query" },
            {
                closeSheet: () => uiUpdates.push("sheet-closed"),
                navigateWithQuery: (query) => fallbackQueries.push(query),
            }
        );

        expect(uiUpdates).toEqual(["sheet-closed"]);
        expect(fallbackQueries).toEqual(["unclassified query"]);
    });
});
