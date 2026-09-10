import { describe, expect, test } from "bun:test";
import {
    EMBEDDING_SYNC_BATCH_SIZE,
    buildEmbeddingSyncPlan,
    getEmbeddingSyncResult,
    isEligibleForEmbeddingSync,
} from "./embedding-sync";

describe("embedding sync planning", () => {
    test("only selects active, published, non-deleted products with missing vectors", () => {
        expect(
            isEligibleForEmbeddingSync({
                isActive: true,
                isPublished: true,
                isDeleted: false,
                searchSuggestionEmbeddings: null,
                semanticSearchEmbeddings: null,
            })
        ).toBe(true);
        expect(
            isEligibleForEmbeddingSync({
                isActive: true,
                isPublished: true,
                isDeleted: false,
                searchSuggestionEmbeddings: [1],
                semanticSearchEmbeddings: [1],
            })
        ).toBe(false);
        expect(
            isEligibleForEmbeddingSync({
                isActive: false,
                isPublished: true,
                isDeleted: false,
                searchSuggestionEmbeddings: null,
                semanticSearchEmbeddings: null,
            })
        ).toBe(false);
    });

    test("builds bounded deterministic plans and dimension-specific text", () => {
        const products = Array.from({ length: EMBEDDING_SYNC_BATCH_SIZE + 2 }, (_, index) => ({
            id: `product-${String(index).padStart(2, "0")}`,
            title: `Product ${index}`,
            description: "Description",
            metaKeywords: ["keyword"],
            brand: { name: "Brand" },
            category: { name: "Category" },
            subcategory: { name: "Subcategory" },
            productType: { name: "Type" },
            isActive: true,
            isPublished: true,
            isDeleted: false,
            searchSuggestionEmbeddings: null,
            semanticSearchEmbeddings: null,
        }));

        const plan = buildEmbeddingSyncPlan(products);

        expect(plan).toHaveLength(EMBEDDING_SYNC_BATCH_SIZE);
        expect(plan[0]?.id).toBe("product-00");
        expect(plan[0]?.suggestionText).not.toContain("Product");
        expect(plan[0]?.semanticText).toContain("Product");
    });

    test("reports partial updates without exposing vector data", () => {
        expect(
            getEmbeddingSyncResult({
                processed: 2,
                updated: 1,
                skipped: 0,
                failed: 0,
                partiallyUpdated: 1,
                alreadyRunning: false,
            })
        ).toEqual({
            processed: 2,
            updated: 1,
            skipped: 0,
            failed: 0,
            partiallyUpdated: 1,
            alreadyRunning: false,
        });
    });
});
