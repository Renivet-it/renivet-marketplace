import { expect, test } from "bun:test";
import { getPostHogPersonProperties } from "./identify-bridge";

test("maps Clerk contact details to the PostHog person properties", () => {
    expect(
        getPostHogPersonProperties({
            email: "ayan@example.com",
            phone: "+919876543210",
        })
    ).toEqual({
        email: "ayan@example.com",
        phone: "+919876543210",
    });
});

test("preserves absent Clerk contact details as undefined", () => {
    expect(getPostHogPersonProperties({})).toEqual({
        email: undefined,
        phone: undefined,
    });
});
