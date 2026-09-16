import { describe, expect, test } from "bun:test";
import {
    createCategoryRedirectEvent,
    createCategoryRouteEvent,
} from "./category-telemetry";

describe("REN-221 bounded category telemetry", () => {
    test("records redirect identity without arbitrary query values", () => {
        const event = createCategoryRedirectEvent({
            outcome: "redirected",
            reason: "success",
            status: 301,
            productTypeId: "product-type-id",
            categoryId: "category-id",
            destinationPathname: "/shop/women",
            environment: "preview",
        });

        expect(event).toEqual({
            event: "category_slug_redirect",
            outcome: "redirected",
            reason: "success",
            status: 301,
            productTypeId: "product-type-id",
            categoryId: "category-id",
            destinationPathname: "/shop/women",
            environment: "preview",
        });
        expect(JSON.stringify(event)).not.toContain("utm_");
    });

    test("records slug route outcome with a closed reason", () => {
        expect(
            createCategoryRouteEvent({
                outcome: "not_found",
                reason: "hierarchy_mismatch",
                status: 404,
                slug: "women",
                environment: "preview",
            })
        ).toMatchObject({
            event: "category_slug_route",
            outcome: "not_found",
            reason: "hierarchy_mismatch",
            status: 404,
            slug: "women",
        });
    });
});
