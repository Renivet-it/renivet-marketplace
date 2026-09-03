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
