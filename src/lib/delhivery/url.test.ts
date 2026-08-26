import { expect, test } from "bun:test";
import { resolveDelhiveryUrl } from "./url";

test("normalizes a configured Delhivery base URL before appending a path", () => {
    expect(resolveDelhiveryUrl("  https://sandbox.example.test///  ", "/api/cmu/create.json"))
        .toBe("https://sandbox.example.test/api/cmu/create.json");
});

test("uses the production fallback when the base URL is blank", () => {
    expect(resolveDelhiveryUrl("   ", "/api/p/edit")).toBe(
        "https://track.delhivery.com/api/p/edit"
    );
});

test("rejects malformed non-empty base URLs before request construction", () => {
    expect(() => resolveDelhiveryUrl("not a url", "/api/p/edit")).toThrow(
        "Invalid DELHIVERY_BASE_URL"
    );
});
