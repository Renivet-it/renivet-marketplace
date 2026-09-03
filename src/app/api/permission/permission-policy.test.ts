import { expect, test } from "bun:test";
import {
    buildPermissionResponse,
    resolvePermissionUserId,
} from "./permission-policy";

test("uses the authenticated user instead of the query-string user", () => {
    expect(
        resolvePermissionUserId({
            authenticatedUserId: "user-a",
            requestedUserId: "user-b",
        })
    ).toBe("user-a");
});

test("rejects a request without an authenticated user", () => {
    expect(
        resolvePermissionUserId({
            authenticatedUserId: null,
            requestedUserId: "user-b",
        })
    ).toBeNull();
});

test("builds a verdict-only permission response", () => {
    expect(buildPermissionResponse(true)).toEqual({
        isAuthorized: true,
    });
    expect(buildPermissionResponse(false)).toEqual({
        isAuthorized: false,
    });
});

test("builds middleware-safe routing context without user profile data", () => {
    expect(
        buildPermissionResponse(true, {
            sitePermissions: 7,
            brandPermissions: 3,
            brandId: "brand-1",
        })
    ).toEqual({
        isAuthorized: true,
        sitePermissions: 7,
        brandPermissions: 3,
        brandId: "brand-1",
    });
});

test("keeps Edge middleware independent from the Redis implementation", async () => {
    const middleware = await Bun.file(
        new URL("../../../middleware.ts", import.meta.url)
    ).text();

    expect(middleware).not.toContain("lib/redis");
    expect(middleware).toContain("routingContext");
});
