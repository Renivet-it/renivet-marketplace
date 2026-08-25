import { describe, expect, test } from "bun:test";

import { shouldApplySearchRelevanceOrdering } from "./product-ordering";

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
