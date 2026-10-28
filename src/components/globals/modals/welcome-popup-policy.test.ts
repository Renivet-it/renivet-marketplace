import { expect, test } from "bun:test";
import { getWelcomePopupDelay } from "./welcome-popup-policy";

test("shows the welcome popup immediately on ReWear even for returning guests", () => {
    expect(
        getWelcomePopupDelay({ pathname: "/rewear", hasVisited: true })
    ).toBe(0);
});

test("keeps the standard delayed welcome popup behavior on other pages", () => {
    expect(
        getWelcomePopupDelay({ pathname: "/shop", hasVisited: false })
    ).toBe(3000);
    expect(
        getWelcomePopupDelay({ pathname: "/shop", hasVisited: true })
    ).toBeNull();
});
