import { describe, expect, test } from "bun:test";
import { getSortLoadingDetail } from "./shop-loading";

describe("getSortLoadingDetail", () => {
    test("shows the selected sort in the shared loader when sorting changes", () => {
        expect(
            getSortLoadingDetail(
                "createdAt:desc",
                "price:asc",
                "Price: Low to High"
            )
        ).toBe("Price: Low to High");
    });

    test("does not open the loader when the selected sort is unchanged", () => {
        expect(
            getSortLoadingDetail(
                "createdAt:desc",
                "createdAt:desc",
                "Newest First"
            )
        ).toBeNull();
    });
});
