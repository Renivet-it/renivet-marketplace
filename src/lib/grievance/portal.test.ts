import { describe, expect, test } from "bun:test";
import { canAccessCustomerGrievance } from "./portal";

describe("customer grievance ownership", () => {
    test("allows an authenticated owner to access a grievance", () => {
        expect(
            canAccessCustomerGrievance(
                { userId: "user-1", category: "GRIEVANCE" },
                "user-1"
            )
        ).toBe(true);
    });

    test("denies another user and non-grievance tickets", () => {
        expect(
            canAccessCustomerGrievance(
                { userId: "user-2", category: "GRIEVANCE" },
                "user-1"
            )
        ).toBe(false);
        expect(
            canAccessCustomerGrievance(
                { userId: "user-1", category: "ORDER" },
                "user-1"
            )
        ).toBe(false);
    });
});
