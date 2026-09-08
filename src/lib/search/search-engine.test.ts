import { describe, expect, test } from "bun:test";
import {
    getSearchRedirectUrl,
    isSearchAnalyticsId,
    type SearchResult,
} from "./search-engine";

const searchId = "4ea0f2d3-d6f5-4d18-9446-0c9c80d4faea";

function searchResult(overrides: Partial<SearchResult>): SearchResult {
    return {
        intentType: "UNKNOWN",
        normalizedQuery: "linen saree",
        originalQuery: "linen saree",
        confidence: "low",
        ...overrides,
    };
}

describe("REN-154 search redirect correlation", () => {
    test("accepts only UUID search IDs before correlating analytics", () => {
        expect(isSearchAnalyticsId(searchId)).toBe(true);
        expect(isSearchAnalyticsId("not-a-search-id")).toBe(false);
    });

    test.each([
        [
            searchResult({ intentType: "BRAND", brandSlug: "earth-kind" }),
            `/brands/earth-kind?searchId=${searchId}`,
        ],
        [
            searchResult({ intentType: "CATEGORY", categoryId: "women" }),
            `/shop?categoryId=women&searchId=${searchId}`,
        ],
        [
            searchResult({
                intentType: "SUBCATEGORY",
                subcategoryId: "sarees",
            }),
            `/shop?subcategoryId=sarees&searchId=${searchId}`,
        ],
        [
            searchResult({
                intentType: "PRODUCT_TYPE",
                productTypeId: "handloom-saree",
            }),
            `/shop?productTypeId=handloom-saree&searchId=${searchId}`,
        ],
        [
            searchResult({ intentType: "UNKNOWN" }),
            `/shop?search=linen%20saree&searchId=${searchId}`,
        ],
    ])(
        "preserves the destination while carrying searchId for %s",
        (result, expectedRedirect) => {
            expect(getSearchRedirectUrl(result, searchId)).toBe(
                expectedRedirect
            );
        }
    );
});
