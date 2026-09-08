import { describe, expect, mock, test } from "bun:test";

const insertedValues: unknown[] = [];
const updatedValues: unknown[] = [];
const returnedSearchId = "c7f3fadb-6cac-4e1d-84ce-1b5114cfbf2e";

mock.module("@/lib/db", () => ({
    db: {
        insert: () => ({
            values: (values: unknown) => {
                insertedValues.push(values);
                return {
                    returning: async () => [{ id: returnedSearchId }],
                };
            },
        }),
        update: () => ({
            set: (values: unknown) => {
                updatedValues.push(values);
                return {
                    where: async () => undefined,
                };
            },
        }),
    },
}));

const { logSearchProductClick, logSearchQuery, logSearchResultCount } =
    await import("./search-engine");

const result = {
    intentType: "UNKNOWN" as const,
    normalizedQuery: "linen saree",
    originalQuery: "Linen Saree",
    confidence: "low" as const,
};

describe("REN-154 search analytics persistence", () => {
    test("returns the inserted row ID so the redirect can correlate later events", async () => {
        const searchId = await logSearchQuery(result);

        expect(searchId).toBe(returnedSearchId);
        expect(insertedValues).toContainEqual(
            expect.objectContaining({
                originalQuery: "Linen Saree",
                normalizedQuery: "linen saree",
            })
        );
    });

    test("writes the server-provided result total to the correlated row", async () => {
        await logSearchResultCount(returnedSearchId, 17);

        expect(updatedValues).toContainEqual(
            expect.objectContaining({ resultCount: "17" })
        );
    });

    test("records the selected product on the correlated search row", async () => {
        await logSearchProductClick(returnedSearchId, "product-17");

        expect(updatedValues).toContainEqual(
            expect.objectContaining({ clickedProductId: "product-17" })
        );
    });
});
