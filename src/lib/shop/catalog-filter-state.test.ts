import { describe, expect, test } from "bun:test";
import { preserveCatalogSearch } from "./catalog-filter-state";

describe("catalog filter state", () => {
    test("keeps the active search when a category filter is selected", () => {
        expect(
            preserveCatalogSearch("aterra luna", {
                categoryId: "men-category",
                subCategoryId: "",
                productTypeId: "",
                shopPage: 1,
            })
        ).toEqual({
            categoryId: "men-category",
            subCategoryId: "",
            productTypeId: "",
            shopPage: 1,
            search: "aterra luna",
        });
    });
});
