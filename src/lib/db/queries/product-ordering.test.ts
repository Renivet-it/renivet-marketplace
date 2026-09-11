import { describe, expect, test } from "bun:test";
import {
    buildPriorityProductOrderCase,
    shouldApplySearchRelevanceOrdering,
} from "./product-ordering";

describe("buildPriorityProductOrderCase", () => {
    test("preserves recommendation rank", () => {
        expect(buildPriorityProductOrderCase(["product-a", "product-b"])).toBe(
            "WHEN products.id::text = 'product-a' THEN 0 WHEN products.id::text = 'product-b' THEN 1"
        );
    });

    test("escapes product IDs safely", () => {
        expect(buildPriorityProductOrderCase(["product-'a"])).toBe(
            "WHEN products.id::text = 'product-''a' THEN 0"
        );
    });
});

describe("shouldApplySearchRelevanceOrdering", () => {
    test("keeps relevance ordering for a search without an explicit sort", () => {
        expect(
            shouldApplySearchRelevanceOrdering({
                isRagSearchActive: true,
                hasRagResults: true,
            })
        ).toBe(true);
    });

    test.each(["createdAt", "price", "best-sellers"] as const)(
        "lets an explicit %s sort order searched results",
        (sortBy) => {
            expect(
                shouldApplySearchRelevanceOrdering({
                    isRagSearchActive: true,
                    hasRagResults: true,
                    sortBy,
                })
            ).toBe(false);
        }
    );
});
