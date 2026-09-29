import { describe, expect, test } from "bun:test";
import { shouldStopCatalogPagination } from "./catalog-pagination";

describe("catalog pagination", () => {
    test("continues when media filtering returns fewer items than the page size", () => {
        expect(
            shouldStopCatalogPagination({
                loadedCount: 20,
                totalCount: 649,
                lastPageCount: 20,
            })
        ).toBe(false);
    });

    test("stops after an empty page or once the reported total is loaded", () => {
        expect(
            shouldStopCatalogPagination({
                loadedCount: 20,
                totalCount: 649,
                lastPageCount: 0,
            })
        ).toBe(true);
        expect(
            shouldStopCatalogPagination({
                loadedCount: 649,
                totalCount: 649,
                lastPageCount: 5,
            })
        ).toBe(true);
    });
});
